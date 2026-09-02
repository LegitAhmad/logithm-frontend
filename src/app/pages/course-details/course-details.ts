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

  isCreator = computed(() => {
    const user = this.authService.user();
    const course = this.course();
    if (!user || !course) return false;
    
    // Check both _id and id properties since they might vary between frontend/backend models
    const userId = (user as any)._id || (user as any).id;
    return course.creatorId === userId;
  });

  constructor() {
    // Re-fetch assignments whenever isCreator status changes
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      
      this.isCreator(); // Register dependency
      untracked(() => this.fetchAssignments());
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.courseId = this.route.snapshot.paramMap.get('id');
      if (this.courseId) {
        this.fetchCourse();
        // this.fetchAssignments(); // Handled by the effect
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
    
    // If the user is the creator, fetch all assignments (including drafts)
    // Otherwise, fetch published assignments only
    const status = this.isCreator() ? 'all' : undefined;
    
    this.assignmentsService.getCourseAssignments(cid, status).subscribe({
      next: (assignments) => this.assignments.set(assignments),
      error: (err) => console.error('Error fetching assignments', err)
    });
  }

  getDueLabel(assignment: Assignment): string {
    return assignment.deadline ? new Date(assignment.deadline).toLocaleString() : 'No due date';
  }

  openAddAssignmentPopup() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.fetchAssignments();
  }
}
