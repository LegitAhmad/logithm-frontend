import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Navbar } from '../../components/navbar/navbar';
import { Submission, SubmissionsService } from '../../services/submissions.service';

@Component({
  selector: 'app-submission-detail', imports: [Navbar, RouterLink, DatePipe], styleUrl: '../product-pages.css', changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-navbar /><main class="product-page"><a routerLink="/submissions">Back to submission history</a><h1>Submission results</h1>
    @if (loading()) { <p role="status">Loading submission…</p> }
    @else if (error()) { <div class="error" role="alert">{{error()}} <button (click)="load()">Try again</button></div> }
    @else if (submission(); as s) {
      <section class="panel"><div class="page-heading"><div><h2>{{s.mode === 'run' ? 'Sample run' : 'Scored submission'}}: {{s.score}} / {{s.maxScore}}</h2><p class="muted">{{s.createdAt | date:'medium'}} · {{s.language}} · {{s.status}}</p></div><a class="button primary" [routerLink]="['/problem-detail',s.questionId]" [queryParams]="s.assignmentId ? {assignmentId:s.assignmentId} : {}">Return to problem</a></div>@if (s.assignmentId) { <a [routerLink]="['/assignment',s.assignmentId]">View assignment</a> }</section>
      <section class="panel"><h2>Test cases</h2>@for (r of s.results; track r.testCaseIndex) {
        <article class="list-row"><div class="w-full"><div class="actions"><h3>Test {{r.testCaseIndex + 1}}{{r.isHidden ? ' (hidden)' : ''}}</h3><span class="badge">{{r.passed ? 'Passed' : (r.verdict || 'Failed')}}</span><span class="muted">{{r.passed ? r.points : 0}} / {{r.points}} points</span></div>
        @if (r.isHidden) { <p class="muted">Hidden test data and execution diagnostics are not shown.</p> }
        @else {
          @if (r.actualOutput !== undefined) { <h4>Returned value</h4><pre>{{r.actualOutput}}</pre> }
          @if (r.diagnostic) { <h4>Diagnostic</h4><pre>{{r.diagnostic}}</pre> }
          @if (r.stderr) { <h4>Debug output</h4><pre>{{r.stderr}}</pre> }
          @if (r.compileOutput) { <h4>Compiler output</h4><pre>{{r.compileOutput}}</pre> }
        }</div></article>
      } @empty { <p class="empty">{{s.status === 'judging' ? 'This attempt is still being judged. Reload to see the results.' : 'No test results were recorded for this attempt.'}}</p> }
      @if (s.status === 'judging') { <button (click)="load()">Refresh results</button> }</section>
    }</main>`,
})
export class SubmissionDetail {
  private readonly service = inject(SubmissionsService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  readonly submission = signal<Submission | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  constructor() { if (isPlatformBrowser(inject(PLATFORM_ID))) this.load(); }
  load() {
    if (!this.id) { this.error.set('No submission was selected.'); return; }
    this.loading.set(true); this.error.set('');
    this.service.getOne(this.id).subscribe({ next: result => { this.submission.set(result); this.loading.set(false); }, error: () => { this.error.set('This submission is unavailable or does not belong to your account.'); this.loading.set(false); } });
  }
}
