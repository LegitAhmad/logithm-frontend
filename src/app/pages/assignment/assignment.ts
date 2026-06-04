import { Component, OnInit, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../components/navbar/navbar';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProblemCreationModal } from '../problem-creation-modal/problem-creation-modal';
import { AssignmentsService, Assignment as AssignmentData } from '../../services/assignments.service';
import { QuestionsService, Question } from '../../services/questions.service';
import { CoursesService } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule, RouterLink, ProblemCreationModal],
  templateUrl: './assignment.html',
  styleUrl: './assignment.css',
})
export class Assignment implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assignmentsService = inject(AssignmentsService);
  private questionsService = inject(QuestionsService);
  private coursesService = inject(CoursesService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  assignmentId: string | null = null;
  assignment = signal<AssignmentData | null>(null);
  allQuestions = signal<Question[]>([]);
  courseCreatorId = signal<string | null>(null);

  // Editable schedule
  startDate = signal('');
  startTime = signal('');
  dueDate  = signal('');
  dueTime  = signal('');
  isSavingSchedule = signal(false);
  scheduleSaved    = signal(false);

  // Question removal
  removingQuestionId = signal<string | null>(null);

  isModalOpen = false;
  isHovered   = false;
  selectedCategory = 'All Topics';
  categories: string[] = ['All Topics'];

  isCreator = computed(() => {
    const user      = this.authService.user();
    const creatorId = this.courseCreatorId();
    if (!user || !creatorId) return false;
    const userId = (user as any)._id || (user as any).id;
    return creatorId === userId;
  });

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.assignmentId = this.route.snapshot.paramMap.get('id');
      if (this.assignmentId) {
        this.authService.fetchCurrentUser().subscribe();
        this.fetchAssignment();
        this.fetchQuestions();

        const courseId = this.route.snapshot.queryParamMap.get('courseId');
        if (courseId) this.resolveCourseCreator(courseId);
      }
    }
  }

  private resolveCourseCreator(courseId: string) {
    this.coursesService.getCourse(courseId).subscribe({
      next:  (course) => this.courseCreatorId.set(course.creatorId),
      error: () => {},
    });
  }

  fetchAssignment() {
    if (!this.assignmentId) return;
    this.assignmentsService.getAssignment(this.assignmentId).subscribe({
      next: (data) => {
        this.assignment.set(data);
        this.initSchedule(data);
        if (!this.route.snapshot.queryParamMap.get('courseId')) {
          const cid = data.courseId || data.course?._id;
          if (cid) this.resolveCourseCreator(cid);
        }
      },
      error: (err) => console.error('Error fetching assignment', err),
    });
  }

  private initSchedule(a: AssignmentData) {
    if (a.startAt) {
      const d = new Date(a.startAt);
      this.startDate.set(d.toISOString().split('T')[0]);
      this.startTime.set(d.toTimeString().slice(0, 5));
    }
    if (a.dueAt) {
      const d = new Date(a.dueAt);
      this.dueDate.set(d.toISOString().split('T')[0]);
      this.dueTime.set(d.toTimeString().slice(0, 5));
    } else if (a.dueDate) {
      this.dueDate.set(a.dueDate);
      this.dueTime.set(a.dueTime || '');
    }
  }

  saveSchedule() {
    if (!this.assignmentId || this.isSavingSchedule()) return;
    this.isSavingSchedule.set(true);

    const payload: Partial<AssignmentData> = {};
    if (this.startDate() && this.startTime()) {
      payload.startAt = new Date(`${this.startDate()}T${this.startTime()}`).toISOString();
    }
    if (this.dueDate() && this.dueTime()) {
      payload.dueAt = new Date(`${this.dueDate()}T${this.dueTime()}`).toISOString();
    }

    this.assignmentsService.updateAssignment(this.assignmentId, payload).subscribe({
      next: (updated) => {
        this.assignment.set(updated);
        this.isSavingSchedule.set(false);
        this.scheduleSaved.set(true);
        setTimeout(() => this.scheduleSaved.set(false), 2500);
      },
      error: (err) => {
        console.error('Error updating schedule', err);
        this.isSavingSchedule.set(false);
      },
    });
  }

  removeQuestion(questionId: string) {
    if (this.removingQuestionId() || !this.assignmentId) return;
    this.removingQuestionId.set(questionId);

    const remaining = this.allQuestions().filter(q => q._id !== questionId);

    this.assignmentsService.updateAssignment(this.assignmentId, {
      questionIds: remaining.map(q => q._id),
    }).subscribe({
      next: () => {
        this.allQuestions.set(remaining);
        this.updateCategories(remaining);
        this.removingQuestionId.set(null);
      },
      error: (err) => {
        console.error('Error removing question', err);
        this.removingQuestionId.set(null);
      },
    });
  }

  fetchQuestions() {
    if (!this.assignmentId) return;
    this.questionsService.getAssignmentQuestions(this.assignmentId).subscribe({
      next: (questions) => {
        this.allQuestions.set(questions);
        this.updateCategories(questions);
      },
      error: (err) => console.error('Error fetching questions', err),
    });
  }

  updateCategories(questions: Question[]) {
    const cats = new Set<string>(['All Topics']);
    questions.forEach(q => q.tags?.forEach(tag => cats.add(tag)));
    this.categories = Array.from(cats);
  }

  openAddProblemPopup() { this.isModalOpen = true; }

  closeModal() {
    this.isModalOpen = false;
    this.fetchQuestions();
  }

  get filteredQuestions() {
    if (this.selectedCategory === 'All Topics') return this.allQuestions();
    return this.allQuestions().filter(q => q.tags?.includes(this.selectedCategory));
  }

  stats = {
    totalSolved: 0, totalQuestions: 0,
    easy:   { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard:   { solved: 0, total: 0 },
  };

  countByDifficulty(diff: string): number {
    return this.allQuestions().filter(q => q.difficulty === diff).length;
  }

  getProgressWidth(solved: number, total: number): string {
    return total === 0 ? '0%' : `${(solved / total) * 100}%`;
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'solved':  return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      default:        return 'text-gray-600';
    }
  }

  setCategory(category: string) { this.selectedCategory = category; }

  difficultyClass(diff: string): string {
    switch (diff) {
      case 'Easy':   return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'Hard':   return 'text-red-400 bg-red-400/10';
      default:       return 'text-gray-400 bg-gray-400/10';
    }
  }

  goBack() {
    const courseId = this.route.snapshot.queryParamMap.get('courseId');
    this.router.navigate(courseId ? ['/course', courseId] : ['/dashboard']);
  }
}
