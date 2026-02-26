import { ChangeDetectionStrategy, Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { RouterLink } from '@angular/router';
import { Course, CoursesService } from '../../services/courses.service';
import { isPlatformBrowser } from '@angular/common';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { AuthService, User as AuthUser } from '../../services/auth.service';
import { Assignment, AssignmentsService } from '../../services/assignments.service';

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
  imports: [Navbar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private coursesService = inject(CoursesService);
  private assignmentsService = inject(AssignmentsService);
  private authService = inject(AuthService);
  private pid = inject(PLATFORM_ID);

  courses = signal<Course[]>([]);
  favoriteCourseIds = signal<Set<string>>(new Set());
  pendingAssignments = signal<AssignmentGroup[]>([]);
  missedAssignments = signal<AssignmentGroup[]>([]);
  activeView = signal<'all' | 'favorites'>('all');
  displayedCourses = computed(() => {
    const favoriteCourseIds = this.favoriteCourseIds();
    const courses = this.courses().map((course) => ({
      ...course,
      isFavorite: favoriteCourseIds.has(course._id),
    }));

    return this.activeView() === 'favorites' ? courses.filter((course) => course.isFavorite) : courses;
  });

  ngOnInit() {
    if (!isPlatformBrowser(this.pid)) {
      return;
    }

    this.loadFavoriteCourses();
    this.loadCourses();
  }

  loadFavoriteCourses() {
    this.authService.fetchCurrentUser().subscribe({
      next: (user: AuthUser) => {
        this.favoriteCourseIds.set(this.extractFavoriteCourseIds(user));
      },
      error: (err) => {
        console.error('Failed to load favorite courses from profile', err);
      },
    });
  }

  loadCourses() {
    this.coursesService
      .getCourses()
      .pipe(
        switchMap((response) => this.coursesService.enrichCoursesWithCreators(response.data)),
      )
      .subscribe({
        next: (enrichedCourses: Course[]) => {
          const favoriteCourseIds = enrichedCourses
            .filter((course) => course.isFavorite)
            .map((course) => course._id);

          if (favoriteCourseIds.length > 0) {
            this.favoriteCourseIds.update((currentFavoriteCourseIds) => {
              const nextFavoriteCourseIds = new Set(currentFavoriteCourseIds);

              favoriteCourseIds.forEach((courseId) => nextFavoriteCourseIds.add(courseId));

              return nextFavoriteCourseIds;
            });
          }

          this.courses.set(enrichedCourses.map(({ isFavorite, ...course }) => course));
          this.loadAssignments(enrichedCourses);
        },
        error: (err) => {
          console.error('Failed to load courses', err);
        },
      });
  }

  loadAssignments(courses: Course[]) {
    if (courses.length === 0) {
      this.pendingAssignments.set([]);
      this.missedAssignments.set([]);
      return;
    }

    forkJoin(
      courses.map((course) =>
        forkJoin({
          pending: this.assignmentsService.getCourseAssignments(course._id, 'pending').pipe(
            catchError(() => of([])),
          ),
          missed: this.assignmentsService.getCourseAssignments(course._id, 'missed').pipe(
            catchError(() => of([])),
          ),
        }),
      ),
    ).subscribe({
      next: (assignmentSets) => {
        const pendingGroups = assignmentSets
          .map((assignmentSet, index) => this.toGroup(courses[index], assignmentSet.pending))
          .filter((group): group is AssignmentGroup => group.tasks.length > 0);

        const missedGroups = assignmentSets
          .map((assignmentSet, index) => this.toGroup(courses[index], assignmentSet.missed))
          .filter((group): group is AssignmentGroup => group.tasks.length > 0);

        this.pendingAssignments.set(pendingGroups);
        this.missedAssignments.set(missedGroups);
      },
      error: (err) => {
        console.error('Failed to load assignments', err);
        this.pendingAssignments.set([]);
        this.missedAssignments.set([]);
      },
    });
  }

  setActiveView(view: 'all' | 'favorites') {
    this.activeView.set(view);
  }

  toggleFavorite(course: Course) {
    const isFavorite = this.favoriteCourseIds().has(course._id);
    const request = isFavorite
      ? this.coursesService.unfavoriteCourse(course._id)
      : this.coursesService.favoriteCourse(course._id);

    request.subscribe({
      next: () => {
        this.favoriteCourseIds.update((currentFavoriteCourseIds) => {
          const nextFavoriteCourseIds = new Set(currentFavoriteCourseIds);

          if (isFavorite) {
            nextFavoriteCourseIds.delete(course._id);
          } else {
            nextFavoriteCourseIds.add(course._id);
          }

          return nextFavoriteCourseIds;
        });
      },
      error: (err) => {
        console.error('Failed to update course favorite state', err);
      },
    });
  }

  private extractFavoriteCourseIds(user: AuthUser): Set<string> {
    const favoriteCourseIds = new Set<string>();
    const favorites = user.favoriteCourseIds ?? user.favoriteCourses ?? user.favorites ?? [];

    for (const favorite of favorites) {
      if (typeof favorite === 'string') {
        favoriteCourseIds.add(favorite);
        continue;
      }

      if (favorite && typeof favorite === 'object' && '_id' in favorite && typeof favorite._id === 'string') {
        favoriteCourseIds.add(favorite._id);
      }
    }

    return favoriteCourseIds;
  }

  private toGroup(course: Course, assignments: Assignment[]): AssignmentGroup {
    return {
      courseId: course._id,
      courseName: course.name,
      tasks: assignments.map((assignment) => ({
        id: assignment._id,
        title: assignment.title ?? assignment.name ?? 'Untitled assignment',
        dueLabel: this.formatDueLabel(assignment),
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
}
