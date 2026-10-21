import { ChangeDetectionStrategy, Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { CourseCreationModal } from '../course-creation-modal/course-creation-modal';
import { Course, CoursesService } from '../../services/courses.service';
import { Assignment, AssignmentsService } from '../../services/assignments.service';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-dashboard', imports: [Navbar, RouterLink, FormsModule, CourseCreationModal], templateUrl: './dashboard.html', styleUrl: '../product-pages.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class Dashboard implements OnInit {
  private readonly coursesService = inject(CoursesService);
  private readonly assignmentsService = inject(AssignmentsService);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly courses = signal<Course[]>([]);
  readonly assignments = signal<Array<Assignment & {courseName:string}>>([]);
  readonly favoriteIds = signal<Set<string>>(new Set());
  readonly activeView = signal<'all' | 'favorites'>('all');
  readonly isModalOpen = signal(false);
  readonly loading = signal(false);
  readonly joining = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal('');
  readonly assignmentsError = signal('');
  joinCode = '';
  readonly displayedCourses = computed(() => this.courses().filter(c => this.activeView() !== 'favorites' || this.favoriteIds().has(c._id)));
  readonly activeAssignments = computed(() => this.assignments().filter(a => a.realStatus === 'active'));
  readonly upcomingAssignments = computed(() => this.assignments().filter(a => a.realStatus === 'pending'));
  ngOnInit() { if (isPlatformBrowser(this.platformId)) this.loadCourses(); }
  loadCourses(append = false) {
    if (this.loading()) return;
    this.loading.set(true); this.error.set('');
    forkJoin({courses:this.coursesService.getCourses(20,append ? this.courses().length : 0), user:this.auth.fetchCurrentUser()}).subscribe({
      next: ({courses,user}) => {
        this.courses.set(append ? [...this.courses(),...courses.data] : courses.data);
        this.hasMore.set(courses.data.length === 20);
        this.favoriteIds.set(new Set((user.favorites ?? []).map(id => typeof id === 'string' ? id : id._id)));
        this.loading.set(false); this.loadAssignments();
      },
      error: () => { this.error.set('Could not load your courses. Try again.'); this.loading.set(false); },
    });
  }
  private loadAssignments() {
    const courses = this.courses();
    if (!courses.length) { this.assignments.set([]); return; }
    this.assignmentsError.set('');
    forkJoin(courses.map(c => this.assignmentsService.getCourseAssignments(c._id))).subscribe({
      next: rows => this.assignments.set(rows.flatMap((list,i) => list.map(a => ({...a,courseName:courses[i].name})))),
      error: () => this.assignmentsError.set('Could not load your assignment overview. Open a course to try again.'),
    });
  }
  toggleFavorite(course: Course) {
    const favorite = this.favoriteIds().has(course._id);
    (favorite ? this.coursesService.unfavoriteCourse(course._id) : this.coursesService.favoriteCourse(course._id)).subscribe({
      next: () => this.favoriteIds.update(ids => { const updated = new Set(ids); favorite ? updated.delete(course._id) : updated.add(course._id); return updated; }),
      error: () => this.error.set('Could not update this course’s favorite status.'),
    });
  }
  joinCourse() {
    if (this.joining() || !this.joinCode.trim()) return;
    this.joining.set(true); this.error.set('');
    this.coursesService.enroll(this.joinCode.trim()).subscribe({
      next: () => { this.joinCode = ''; this.joining.set(false); this.loadCourses(); },
      error: () => { this.error.set('Could not join this course. Check the eight-character code with your teacher.'); this.joining.set(false); },
    });
  }
  onCourseCreated() { this.isModalOpen.set(false); this.loadCourses(); }
}
