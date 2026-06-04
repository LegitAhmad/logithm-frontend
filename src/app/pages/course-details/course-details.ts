import { Component, OnInit, inject, PLATFORM_ID, computed, signal, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { RouterLink, ActivatedRoute } from "@angular/router";
import { AssignmentCreationModal } from '../assignment-creation-modal/assignment-creation-modal';
import { AssignmentsService, Assignment } from '../../services/assignments.service';
import { CoursesService, Course } from '../../services/courses.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [Navbar, RouterLink, AssignmentCreationModal, CommonModule],
  templateUrl: './course-details.html',
  styleUrl: './course-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private assignmentsService = inject(AssignmentsService);
  private coursesService = inject(CoursesService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  courseId: string | null = null;
  course = signal<Course | null>(null);
  assignments = signal<Assignment[]>([]);
  isModalOpen = signal(false);
  isHovered = false;
  deletingId = signal<string | null>(null);

  isCreator = computed(() => {
    const user = this.authService.user();
    const course = this.course();
    if (!user || !course) return false;

    const userId = (user as any)._id || (user as any).id;
    return course.creatorId === userId;
  });

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;

      this.isCreator();
      untracked(() => this.fetchAssignments());
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.courseId = this.route.snapshot.paramMap.get('id');
      if (this.courseId) {
        this.fetchCourse();
        this.authService.fetchCurrentUser().subscribe();
      }
    }
  }

  fetchCourse() {
    if (!this.courseId) return;
    this.coursesService.getCourse(this.courseId).subscribe({
      next: (course) => this.course.set(course),
      error: (err) => console.error('Error fetching course', err)
    });
  }

  fetchAssignments() {
    const cid = this.courseId || this.route.snapshot.paramMap.get('id');
    if (!cid) return;

    const status = this.isCreator() ? 'all' : undefined;

    this.assignmentsService.getCourseAssignments(cid, status).subscribe({
      next: (assignments) => this.assignments.set(assignments),
      error: (err) => console.error('Error fetching assignments', err)
    });
  }

  deleteAssignment(event: Event, assignmentId: string) {
    event.stopPropagation();
    event.preventDefault();

    if (this.deletingId()) return;
    this.deletingId.set(assignmentId);

    this.assignmentsService.deleteAssignment(assignmentId).subscribe({
      next: () => {
        this.assignments.update(list => list.filter(a => a._id !== assignmentId));
        this.deletingId.set(null);
      },
      error: (err) => {
        console.error('Error deleting assignment', err);
        this.deletingId.set(null);
      }
    });
  }

  countByStatus(status: string): number {
    return this.assignments().filter(a => a.status === status).length;
  }

  getDueLabel(assignment: Assignment): string {
    if (assignment.dueAt) {
      return new Date(assignment.dueAt).toLocaleString();
    }
    return assignment.dueDate ? `${assignment.dueTime || ''} ${assignment.dueDate}` : 'No due date';
  }

  openAddAssignmentPopup() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.fetchAssignments();
  }
}
