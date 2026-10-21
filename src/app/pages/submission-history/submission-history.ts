import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Submission, SubmissionsService } from '../../services/submissions.service';

@Component({
  selector: 'app-submission-history', imports: [Navbar, RouterLink, DatePipe, FormsModule], styleUrl: '../product-pages.css', changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-navbar /><main class="product-page"><header class="page-heading"><div><h1>Your submissions</h1><p class="muted">Review recorded runs and scored submissions, newest first.</p></div><a class="button" routerLink="/problems">Browse problems</a></header>
    <section class="panel"><div class="filters"><label>Attempt type<select [ngModel]="mode()" (ngModelChange)="mode.set($event)"><option value="">All attempts</option><option value="submit">Scored submissions</option><option value="run">Sample runs</option></select></label></div>
    @if (loading()) { <p role="status">Loading your submissions…</p> }
    @else if (error()) { <div class="error" role="alert">{{error()}} <button (click)="load()">Try again</button></div> }
    @else { <div class="list">@for (s of filtered(); track s._id) { <article class="list-row"><div><a class="row-title" [routerLink]="['/submissions',s._id]">{{s.mode === 'run' ? 'Sample run' : 'Submission'}} · {{s.score}} / {{s.maxScore}}</a><div class="metadata"><span>{{s.createdAt | date:'medium'}}</span><span>{{s.language}}</span><span>{{s.status}}</span><span>{{s.assignmentId ? 'Course assignment' : 'Practice'}}</span></div></div><a class="button" [routerLink]="['/problem-detail',s.questionId]" [queryParams]="s.assignmentId ? {assignmentId:s.assignmentId} : {}">Open problem</a></article> } @empty { <p class="empty">No {{mode() === 'run' ? 'sample runs' : mode() === 'submit' ? 'scored submissions' : 'attempts'}} yet. Open a problem and run your solution to begin.</p> }</div> }
    </section></main>`,
})
export class SubmissionHistory {
  private readonly service = inject(SubmissionsService);
  readonly submissions = signal<Submission[]>([]);
  readonly mode = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly filtered = computed(() => this.submissions().filter(s => !this.mode() || s.mode === this.mode()));
  constructor() { if (isPlatformBrowser(inject(PLATFORM_ID))) this.load(); }
  load() {
    this.loading.set(true); this.error.set('');
    this.service.getMine().subscribe({ next: rows => { this.submissions.set(rows); this.loading.set(false); }, error: () => { this.error.set('Could not load your submission history.'); this.loading.set(false); } });
  }
}
