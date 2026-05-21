import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { RouterLink } from '@angular/router';
import { CourseCreationModal } from '../course-creation-modal/course-creation-modal';
import { isPlatformBrowser } from '@angular/common';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { Course, CoursesService } from '../../services/courses.service';
import { Assignment, AssignmentsService } from '../../services/assignments.service';
import { AuthService, User as AuthUser } from '../../services/auth.service';

type AssignmentTask = {
  id: string;
  title: string;
  dueLabel: string;
};

type AssignmentGroup = {
  courseId: string;
  courseName: string;
  tasks: AssignmentTask[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [Navbar, RouterLink, CourseCreationModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private coursesService = inject(CoursesService);
  private assignmentsService = inject(AssignmentsService);
  private authService = inject(AuthService);
  private pid = inject(PLATFORM_ID);

  // ✅ Modal
  isModalOpen = false;

  openAddCoursePopup() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onCourseCreated(course: Course) {
    // Add the new course to the list immediately for better UX
    this.courses.update((current) => {
      const updated = [course, ...current];
      return updated;
    });
    // Also trigger a full refresh to get enriched data (like creator name) and assignments
    this.loadCourses();
  }

  // ✅ Signals
  courses = signal<Course[]>([]);
  favoriteCourseIds = signal<Set<string>>(new Set());
  pendingAssignments = signal<AssignmentGroup[]>([]);
  missedAssignments = signal<AssignmentGroup[]>([]);
  activeView = signal<'all' | 'favorites'>('all');

  displayedCourses = computed(() => {
    const favorites = this.favoriteCourseIds();
    const allCourses = this.courses().map((course) => ({
      ...course,
      isFavorite: favorites.has(course._id),
    }));

    return this.activeView() === 'favorites' ? allCourses.filter((c) => c.isFavorite) : allCourses;
  });

  ngOnInit() {
    if (!isPlatformBrowser(this.pid)) return;

    this.loadFavoriteCourses();
    this.loadCourses();
  }

  setActiveView(view: 'all' | 'favorites') {
    this.activeView.set(view);
  }

  toggleFavorite(course: Course) {
    const isFav = this.favoriteCourseIds().has(course._id);

    const req = isFav
      ? this.coursesService.unfavoriteCourse(course._id)
      : this.coursesService.favoriteCourse(course._id);

    req.subscribe({
      next: () => {
        this.favoriteCourseIds.update((set) => {
          const next = new Set(set);
          isFav ? next.delete(course._id) : next.add(course._id);
          return next;
        });
      },
      error: (err) => {
        console.error('Dashboard: Failed to update course favorite state', err);
      },
    });
  }

  loadCourses() {
    this.coursesService
      .getCourses()
      .pipe(
        switchMap((res) => {
          return this.coursesService.enrichCoursesWithCreators(res.data);
        }),
      )
      .subscribe({
        next: (courses: Course[]) => {
          this.courses.set(courses);
          this.loadAssignments(courses);
        },
        error: (err) => {
          console.error('Dashboard: Failed to load courses', err);
        },
      });
  }

  private loadFavoriteCourses() {
    this.authService.fetchCurrentUser().subscribe({
      next: (user: AuthUser) => {
        this.favoriteCourseIds.set(this.extractFavoriteCourseIds(user));
      },
      error: (err) => {
        console.error('Failed to load favorite courses from profile', err);
      },
    });
  }

  private loadAssignments(courses: Course[]) {
    if (courses.length === 0) {
      this.pendingAssignments.set([]);
      this.missedAssignments.set([]);
      return;
    }

    forkJoin(
      courses.map((course) =>
        forkJoin({
          pending: this.assignmentsService
            .getCourseAssignments(course._id, 'pending')
            .pipe(catchError(() => of([]))),
          missed: this.assignmentsService
            .getCourseAssignments(course._id, 'missed')
            .pipe(catchError(() => of([]))),
        }),
      ),
    ).subscribe({
      next: (results) => {
        this.pendingAssignments.set(
          results
            .map((r, i) => this.toGroup(courses[i], r.pending))
            .filter((g) => g.tasks.length > 0),
        );

        this.missedAssignments.set(
          results
            .map((r, i) => this.toGroup(courses[i], r.missed))
            .filter((g) => g.tasks.length > 0),
        );
      },
      error: (err) => {
        console.error('Failed to load assignments', err);
        this.pendingAssignments.set([]);
        this.missedAssignments.set([]);
      },
    });
  }

  private toGroup(course: Course, assignments: Assignment[]): AssignmentGroup {
    return {
      courseId: course._id,
      courseName: course.name,
      tasks: assignments.map((a) => ({
        id: a._id,
        title: a.title ?? a.name ?? 'Untitled assignment',
        dueLabel: this.formatDueLabel(a),
      })),
    };
  }

  private formatDueLabel(assignment: Assignment): string {
    if (assignment.dueTime && assignment.dueDate) {
      return `${assignment.dueTime} ${assignment.dueDate}`;
    }

    if (assignment.dueAt) {
      return assignment.dueAt;
    }

    if (assignment.dueDate) {
      return assignment.dueDate;
    }

    return 'No due date';
  }

  private extractFavoriteCourseIds(user: AuthUser): Set<string> {
    const favoriteCourseIds = new Set<string>();
    const favorites = user.favoriteCourseIds ?? user.favoriteCourses ?? user.favorites ?? [];

    for (const favorite of favorites) {
      if (typeof favorite === 'string') {
        favoriteCourseIds.add(favorite);
        continue;
      }

      if (
        favorite &&
        typeof favorite === 'object' &&
        '_id' in favorite &&
        typeof favorite._id === 'string'
      ) {
        favoriteCourseIds.add(favorite._id);
      }
    }

    return favoriteCourseIds;
  }
}
