import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Navbar } from '../../components/navbar/navbar';
import { QuestionsService, Question } from '../../services/questions.service';
import { SubmissionsService, Submission } from '../../services/submissions.service';
import { AuthService } from '../../services/auth.service';
import { apiError, starterCode, typeLabel } from '../../services/coding-contract';

@Component({
  selector: 'app-problem-detail',
  imports: [CommonModule, FormsModule, MarkdownModule, MonacoEditorModule, Navbar, RouterLink],
  templateUrl: './problem-detail.html',
  styleUrl: './problem-detail.css',
})
export class ProblemDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly questionsService = inject(QuestionsService);
  private readonly submissionsService = inject(SubmissionsService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly question = signal<Question | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly language = signal('python');
  readonly languages = [{ id: 'python', label: 'Python' }, { id: 'javascript', label: 'JavaScript' }, { id: 'typescript', label: 'TypeScript' }, { id: 'go', label: 'Go' }];
  readonly isRunning = signal(false);
  readonly isSubmitting = signal(false);
  readonly busy = computed(() => this.isRunning() || this.isSubmitting());
  readonly submitError = signal<string | null>(null);
  readonly storageMessage = signal<string | null>(null);
  readonly testResults = signal<Submission | null>(null);
  readonly selectedCase = signal(0);
  readonly plainEditor = signal(false);
  readonly activeTest = computed(() => this.question()?.testCases[this.selectedCase()] ?? null);
  readonly publicResults = computed(() => this.testResults()?.results.filter(result => !result.isHidden) ?? []);
  readonly activeResult = computed(() => this.publicResults()[this.selectedCase()] ?? null);
  readonly hiddenResults = computed(() => this.testResults()?.results.filter(result => result.isHidden) ?? []);
  readonly canEdit = computed(() => !!this.auth.user()?._id && this.auth.user()?._id === this.question()?.ownerId);
  readonly contractDescription = computed(() => {
    const execution = this.question()?.execution;
    return execution ? `${execution.functionName}(${execution.parameters.map(parameter => `${parameter.name}: ${typeLabel(parameter.type)}`).join(', ')}) → ${typeLabel(execution.returnType)}` : null;
  });
  code = '';
  editorOptions = { theme: 'vs-dark', language: 'python', automaticLayout: true, fontSize: 15, fontFamily: 'ui-monospace, monospace', minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 16, bottom: 16 } };
  private questionId: string | null = null;
  assignmentId: string | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.questionId = params.get('id');
      this.assignmentId = this.route.snapshot.queryParamMap.get('assignmentId');
      this.question.set(null);
      this.testResults.set(null);
      this.selectedCase.set(0);
      this.fetchQuestion();
    });
  }

  fetchQuestion(): void {
    if (!this.questionId) { this.isLoading.set(false); this.loadError.set('Choose a problem from the problem bank.'); return; }
    this.isLoading.set(true);
    this.loadError.set(null);
    this.questionsService.getQuestion(this.questionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: question => {
        this.question.set({ ...question, testCases: question.testCases.filter(test => !test.isHidden) });
        this.restoreCode();
        this.isLoading.set(false);
      },
      error: error => { this.loadError.set(apiError(error)); this.isLoading.set(false); },
    });
  }

  changeLanguage(language: string): void {
    if (this.busy() || !this.languages.some(entry => entry.id === language)) return;
    this.persistCode(this.code);
    this.language.set(language);
    this.editorOptions = { ...this.editorOptions, language };
    this.restoreCode();
    this.testResults.set(null);
    this.submitError.set(null);
  }

  updateCode(code: string): void {
    this.code = code;
    this.persistCode(code);
  }

  resetCode(): void {
    const execution = this.question()?.execution;
    if (!execution || this.busy()) return;
    if (this.isBrowser && !window.confirm('Replace this language’s saved draft with the starter function?')) return;
    this.updateCode(starterCode(execution, this.language()));
  }

  private restoreCode(): void {
    const execution = this.question()?.execution;
    if (!execution) { this.code = ''; return; }
    try { this.code = localStorage.getItem(`logithm:draft:${this.questionId}:${this.language()}`) ?? starterCode(execution, this.language()); }
    catch { this.code = starterCode(execution, this.language()); this.storageMessage.set('Browser storage is unavailable. Keep a copy of your solution before leaving.'); }
  }

  private persistCode(code: string): void {
    if (!this.isBrowser || !this.questionId) return;
    try { localStorage.setItem(`logithm:draft:${this.questionId}:${this.language()}`, code); }
    catch { this.storageMessage.set('Your draft could not be saved in this browser. Keep a copy before leaving.'); }
  }

  execute(mode: 'run' | 'submit'): void {
    if (!this.questionId || !this.question()?.execution || this.busy()) return;
    if (!this.code.trim()) { this.submitError.set('Write a function before running your solution.'); return; }
    this.isRunning.set(mode === 'run');
    this.isSubmitting.set(mode === 'submit');
    this.submitError.set(null);
    this.testResults.set(null);
    const payload = { questionId: this.questionId, assignmentId: this.assignmentId ?? undefined, language: this.language(), code: this.code };
    const request = mode === 'run' ? this.submissionsService.run(payload) : this.submissionsService.submit(payload);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: submission => { this.testResults.set(submission); this.isRunning.set(false); this.isSubmitting.set(false); },
      error: error => { this.submitError.set(apiError(error)); this.isRunning.set(false); this.isSubmitting.set(false); },
    });
  }
}
