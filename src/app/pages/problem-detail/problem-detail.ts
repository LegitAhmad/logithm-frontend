import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Navbar } from '../../components/navbar/navbar';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { QuestionsService, Question, TestCase } from '../../services/questions.service';
import { SubmissionsService, TestCaseResult } from '../../services/submissions.service';

@Component({
  selector: 'app-problem-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MarkdownModule,
    MonacoEditorModule,
    Navbar
  ],
  templateUrl: './problem-detail.html',
  styleUrl: './problem-detail.css',
})
export class ProblemDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private questionsService = inject(QuestionsService);
  private submissionsService = inject(SubmissionsService);

  // No language selector in the UI yet — Monaco is hardcoded to Python below.
  private readonly language = 'python';

  isBrowser: boolean = false;
  questionId: string | null = null;
  question = signal<Question | null>(null);

  // Kept as a plain property (not a signal): ngx-monaco-editor-v2's
  // [(ngModel)] two-way binding needs a settable plain property, not a
  // WritableSignal. It's still updated safely because every place that
  // sets it also sets a sibling signal in the same callback tick, which
  // triggers the change-detection pass that picks this up too.
  code: string = '';

  // Monaco Options for a writable, responsive editor
  editorOptions = {
    theme: 'vs-dark',
    language: 'python',
    automaticLayout: true,

    fontSize: 15,
    fontFamily: 'Inter, monospace',
    fontLigatures: true,

    minimap: { enabled: false },
    scrollBeyondLastLine: false,

    smoothScrolling: true,
    cursorSmoothCaretAnimation: 'on',
    cursorBlinking: 'smooth',
    roundedSelection: true,
    renderLineHighlight: 'all',

    padding: { top: 16, bottom: 16 },

    renderWhitespace: 'selection',
    cursorWidth: 2,
    letterSpacing: 0.5,

    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
      useShadows: false
    },

    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,

    folding: true,
    lineNumbersMinChars: 3
  };

  markdownContent: string = '';
  testResults = signal<{ results: TestCaseResult[]; score: number; maxScore: number } | null>(null);
  selectedCase = 1;
  isRunning = signal(false);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  testCases: TestCase[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.questionId = this.route.snapshot.paramMap.get('id');
      if (this.questionId) {
        this.fetchQuestion();
      }
    }
  }

  fetchQuestion() {
    if (!this.questionId) return;
    this.questionsService.getQuestion(this.questionId).subscribe({
      next: (q) => {
        this.code = q.functionSignature || '';
        this.markdownContent = q.descriptionMd || '';
        this.testCases = q.testCases || [];
        this.question.set(q);
      },
      error: (err) => console.error('Error fetching question', err)
    });
  }

  private themeInitialized = false;

  async onEditorInit(editor: any) {
    if (!this.isBrowser) return;

    const monaco = await import('monaco-editor');

    // Define theme if not already defined
    if (!this.themeInitialized) {
      monaco.editor.defineTheme('logithm-theme', {
        base: 'vs-dark', // Changed from 'vs' to 'vs-dark'
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'ebd5ab' },
          { token: 'string', foreground: 'facc15' },
          { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
          { token: 'number', foreground: 'facc15' }
        ],
        colors: {
          // Use transparency to let the CSS background show through
          'editor.background': '#00000000',
          'editorGutter.background': '#00000000',
          'editor.lineHighlightBackground': '#ffffff05',

          'editor.foreground': '#ffffff',
          'editorCursor.foreground': '#facc15',
          'editorLineNumber.foreground': '#4b5563',
          'editorLineNumber.activeForeground': '#facc15',

          // Clean up borders
          'editor.border': '#00000000',
          'editorBracketMatch.background': '#ffffff10',
          'editorBracketMatch.border': '#facc15'
        }
      });

      this.themeInitialized = true;
    }

    // 🔥 IMPORTANT — Apply theme AFTER small delay
    setTimeout(() => {
      monaco.editor.setTheme('logithm-theme');
    }, 0);
  }

  runTest(): void {
    if (!this.questionId || this.testCases.length === 0 || this.isRunning()) return;

    this.isRunning.set(true);
    this.submitError.set(null);

    this.submissionsService
      .run({ questionId: this.questionId, language: this.language, code: this.code })
      .subscribe({
        next: (submission) => {
          this.testResults.set({
            results: submission.results,
            score: submission.score,
            maxScore: submission.maxScore,
          });
          this.isRunning.set(false);
        },
        error: (err) => {
          console.error('Error running code', err);
          this.submitError.set(this.readErrorMessage(err));
          this.isRunning.set(false);
        },
      });
  }

  submitCode(): void {
    if (!this.questionId || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.submissionsService
      .submit({ questionId: this.questionId, language: this.language, code: this.code })
      .subscribe({
        next: (submission) => {
          this.testResults.set({
            results: submission.results,
            score: submission.score,
            maxScore: submission.maxScore,
          });
          this.isSubmitting.set(false);
        },
        error: (err) => {
          console.error('Error submitting code', err);
          this.submitError.set(this.readErrorMessage(err));
          this.isSubmitting.set(false);
        },
      });
  }

  // The active test result for the currently selected case, when the last
  // run's results align 1:1 with the visible test cases (i.e. "Run", not
  // "Submit" — submissions also grade hidden cases, so indices can differ).
  get activeResult(): TestCaseResult | null {
    const results = this.testResults();
    if (!results) return null;
    return results.results[this.selectedCase - 1] ?? null;
  }

  private readErrorMessage(error: unknown): string {
    const payload = (error as { error?: unknown })?.error;
    if (payload && typeof payload === 'object' && 'message' in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return 'Something went wrong. Please try again.';
  }
}