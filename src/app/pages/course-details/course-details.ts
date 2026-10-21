import { ChangeDetectionStrategy, Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { AssignmentCreationModal } from '../assignment-creation-modal/assignment-creation-modal';
import { AssignmentsService, Assignment } from '../../services/assignments.service';
import { CoursesService, Course } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';

@Component({ selector: 'app-course-details', imports: [Navbar, RouterLink, AssignmentCreationModal, CommonModule], templateUrl: './course-details.html', styleUrl: '../product-pages.css', changeDetection: ChangeDetectionStrategy.OnPush })
export class CourseDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly assignmentsService = inject(AssignmentsService);
  private readonly coursesService = inject(CoursesService);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly courseId = this.route.snapshot.paramMap.get('id');
  readonly course = signal<Course | null>(null);
  readonly assignments = signal<Assignment[]>([]);
  readonly isModalOpen = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly activeView = signal<'all' | 'active' | 'draft' | 'missed'>('all');
  readonly isCreator = computed(() => {
    const userId = this.auth.user()?._id;
    const course = this.course();
    return !!userId && !!course && (course.creatorId === userId || !!course.admins?.includes(userId));
  });
  readonly displayedAssignments = computed(() => this.assignments().filter(a => this.activeView() === 'all' || a.realStatus === this.activeView()));
  ngOnInit() { if (isPlatformBrowser(this.platformId)) this.fetchCourse(); }
  fetchCourse() {
    if (!this.courseId) return;
    this.loading.set(true); this.error.set('');
    forkJoin({course:this.coursesService.getCourse(this.courseId), user:this.auth.fetchCurrentUser()}).subscribe({
      next: ({course}) => { this.course.set(course); this.fetchAssignments(); },
      error: () => { this.error.set('This course is unavailable or you are not enrolled.'); this.loading.set(false); },
    });
  }
  fetchAssignments() {
    if (!this.courseId) return;
    this.assignmentsService.getCourseAssignments(this.courseId).subscribe({ next: rows => { this.assignments.set(rows); this.loading.set(false); }, error: () => { this.error.set('Could not load this course’s assignments.'); this.loading.set(false); } });
  }
  closeModal() { this.isModalOpen.set(false); this.fetchAssignments(); }
}
