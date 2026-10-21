import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Navbar } from '../../components/navbar/navbar';
import { QuestionsService, Question } from '../../services/questions.service';
import { Assignment, AssignmentsService } from '../../services/assignments.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-problem-bank', imports: [Navbar, RouterLink, FormsModule],
  styleUrl: '../product-pages.css', changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-navbar /><main class="product-page">
    <header class="page-heading"><div><h1>Problem bank</h1><p class="muted">Practice public problems or manage the questions you author.</p></div><a class="button primary" routerLink="/problem-creation" [queryParams]="assignmentId ? {assignmentId} : {}">Create problem</a></header>
    @if (assignment(); as a) { <section class="panel"><h2>Add problems to {{a.title}}</h2><p class="muted">Choose public problems or your own questions for this draft.</p><a [routerLink]="['/assignment',a._id]">Return to assignment</a>@if (notice()) { <p role="status">{{notice()}}</p> }</section> }
    <section class="panel"><div class="filters">
      <label>Search problems<input type="search" [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Title or topic" /></label>
      <label>Collection<select [ngModel]="collection()" (ngModelChange)="collection.set($event)"><option value="public">Public problems</option><option value="mine">My problems</option></select></label>
      <label>Difficulty<select [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)"><option value="">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
    </div>
    @if (loading()) { <p role="status">Loading problems…</p> }
    @else if (error()) { <div class="error" role="alert">{{error()}} <button (click)="load()">Try again</button></div> }
    @else { <p class="muted">{{filtered().length}} problems</p><div class="list">@for (q of filtered(); track q._id) {
      <article class="list-row"><div><a class="row-title" [routerLink]="['/problem-detail',q._id]">{{q.title}}</a><div class="metadata"><span>{{q.difficulty}}</span><span>{{q.tags.join(', ')}}</span><span>{{q.isPublic ? 'Public' : 'Private'}}</span></div></div>
      @if (collection() === 'mine') { <a class="button" routerLink="/problem-creation" [queryParams]="{questionId:q._id, assignmentId}">Edit problem</a> }
      @if (assignment(); as a) { <button (click)="attach(q)" [disabled]="saving() || a.questionIds.includes(q._id)">{{a.questionIds.includes(q._id) ? 'Added to assignment' : 'Add to assignment'}}</button> }
      </article>
    } @empty { <p class="empty">{{search() || difficulty() ? 'No problems match these filters. Try another search.' : collection() === 'mine' ? 'You have not authored any problems. Create a problem to get started.' : 'No public problems have been published yet. Check your course assignments or create your own.'}}</p> }</div> }
    </section>
  </main>`,
})
export class ProblemBank {
  private readonly questions = inject(QuestionsService);
  private readonly assignments = inject(AssignmentsService);
  private readonly auth = inject(AuthService);
  readonly assignment = signal<Assignment | null>(null);
  readonly saving = signal(false);
  readonly notice = signal('');
  readonly assignmentId = inject(ActivatedRoute).snapshot.queryParamMap.get('assignmentId');
  readonly search = signal('');
  readonly collection = signal('public');
  readonly difficulty = signal('');
  readonly publicQuestions = signal<Question[]>([]);
  readonly mine = signal<Question[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filtered = computed(() => {
    const search = this.search().toLowerCase().trim();
    return (this.collection() === 'mine' ? this.mine() : this.publicQuestions()).filter(q => (!this.difficulty() || q.difficulty === this.difficulty()) && (!search || `${q.title} ${q.tags.join(' ')}`.toLowerCase().includes(search)));
  });
  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this.load();
    if (this.assignmentId) {
      forkJoin({assignment:this.assignments.getAssignment(this.assignmentId), user:this.auth.fetchCurrentUser()}).subscribe({
        next: ({assignment,user}) => { if (assignment.ownerId === user._id && assignment.status === 'draft') this.assignment.set(assignment); else this.notice.set('Only the owner of a draft can add questions.'); },
        error: () => this.error.set('The assignment is unavailable or you do not have access.'),
      });
    }
  }
  load() {
    this.loading.set(true); this.error.set('');
    forkJoin({ public: this.questions.getPublic(), mine: this.questions.getMine() }).subscribe({
      next: data => { this.publicQuestions.set(data.public); this.mine.set(data.mine); this.loading.set(false); },
      error: () => { this.error.set('Could not load the problem bank.'); this.loading.set(false); },
    });
  }
  attach(question: Question) {
    const assignment = this.assignment();
    if (!assignment || this.saving() || assignment.questionIds.includes(question._id)) return;
    this.saving.set(true); this.notice.set('');
    this.assignments.updateAssignment(assignment._id, {questionIds:[...assignment.questionIds,question._id]}).subscribe({
      next: updated => { this.assignment.set(updated); this.notice.set(`Added ${question.title} to the assignment.`); this.saving.set(false); },
      error: () => { this.notice.set('Could not add the question to the assignment.'); this.saving.set(false); },
    });
  }
}
