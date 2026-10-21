import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { AssignmentsService, Assignment as AssignmentData } from '../../services/assignments.service';
import { QuestionsService, Question } from '../../services/questions.service';
import { SubmissionsService, Submission } from '../../services/submissions.service';
import { AuthService } from '../../services/auth.service';
import { apiError } from '../../services/coding-contract';

@Component({ selector: 'app-assignment', imports: [Navbar, CommonModule, RouterLink, FormsModule], templateUrl: './assignment.html', styleUrl: '../product-pages.css' })
export class Assignment implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly assignmentsService = inject(AssignmentsService);
  private readonly questionsService = inject(QuestionsService);
  private readonly submissionsService = inject(SubmissionsService);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly assignmentId = this.route.snapshot.paramMap.get('id');
  readonly assignment = signal<AssignmentData | null>(null);
  readonly allQuestions = signal<Question[]>([]);
  readonly submissions = signal<Submission[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly resultsError = signal('');
  readonly isPublishing = signal(false);
  readonly search = signal('');
  readonly difficulty = signal('');
  startAt = '';
  deadline = '';
  readonly isOwner = computed(() => this.assignment()?.ownerId === this.auth.user()?._id);
  readonly filteredQuestions = computed(() => this.allQuestions().filter(q => q.title.toLowerCase().includes(this.search().toLowerCase()) && (!this.difficulty() || q.difficulty === this.difficulty())));
  readonly solved = computed(() => new Set(this.submissions().filter(s => s.mode === 'submit' && s.maxScore > 0 && s.score === s.maxScore).map(s => s.questionId)));

  ngOnInit() { if (isPlatformBrowser(this.platformId)) this.load(); }
  load() {
    if (!this.assignmentId) return;
    this.loading.set(true); this.error.set('');
    forkJoin({ assignment: this.assignmentsService.getAssignment(this.assignmentId), user: this.auth.fetchCurrentUser() }).subscribe({
      next: ({ assignment }) => {
        this.assignment.set(assignment); this.loading.set(false);
        if (assignment.realStatus !== 'pending' || this.isOwner()) this.fetchQuestions();
        this.submissionsService.getMine().subscribe({ next: rows => this.submissions.set(rows.filter(s => s.assignmentId === this.assignmentId)), error: () => this.resultsError.set('Your past attempts could not be loaded. Open submission history to try again.') });
      },
      error: () => { this.error.set('This assignment is unavailable or you do not have access.'); this.loading.set(false); },
    });
  }
  fetchQuestions() {
    if (!this.assignmentId) return;
    this.questionsService.getAssignmentQuestions(this.assignmentId).subscribe({ next: rows => this.allQuestions.set(rows), error: () => this.error.set('Could not load the assignment questions.') });
  }
  publishAssignment() {
    if (!this.assignmentId || this.isPublishing()) return;
    this.error.set('');
    const start = this.startAt ? new Date(this.startAt) : undefined;
    const end = this.deadline ? new Date(this.deadline) : undefined;
    if ((start && (!Number.isFinite(start.getTime()) || start <= new Date())) || (end && (!Number.isFinite(end.getTime()) || end <= (start ?? new Date())))) {
      this.error.set('Choose a future start time and a deadline after the start.'); return;
    }
    this.isPublishing.set(true);
    this.assignmentsService.publishAssignment(this.assignmentId, { ...(start ? {startAt:start.toISOString()} : {}), ...(end ? {deadline:end.toISOString()} : {}) }).subscribe({
      next: value => { this.assignment.set(value); this.isPublishing.set(false); },
      error: err => { this.error.set(typeof err.error?.message === 'string' ? err.error.message : 'Could not publish the assignment. Check the questions and dates.'); this.isPublishing.set(false); },
    });
  }
  unpublishAssignment(): void {
    const assignment = this.assignment();
    if (!assignment || !this.isOwner() || assignment.realStatus !== 'pending' || this.isPublishing()) return;
    this.isPublishing.set(true);
    this.error.set('');
    this.assignmentsService.unpublishAssignment(assignment._id).subscribe({
      next: updated => { this.assignment.set(updated); this.isPublishing.set(false); },
      error: error => { this.error.set(apiError(error)); this.isPublishing.set(false); },
    });
  }
  removeQuestion(id: string) {
    const assignment = this.assignment();
    if (!assignment || !this.isOwner()) return;
    this.assignmentsService.updateAssignment(assignment._id, {questionIds:assignment.questionIds.filter(q => q !== id)}).subscribe({ next: updated => { this.assignment.set(updated); this.allQuestions.update(rows => rows.filter(q => q._id !== id)); }, error: () => this.error.set('Could not remove the question from this draft.') });
  }
}
