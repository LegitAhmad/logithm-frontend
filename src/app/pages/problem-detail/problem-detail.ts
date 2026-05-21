import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Navbar } from '../../components/navbar/navbar';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { QuestionsService, Question } from '../../services/questions.service';

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

  isBrowser: boolean = false;
  questionId: string | null = null;
  question: Question | null = null;

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
  testResults: any = null;
  selectedCase = 1;

  testCases: any[] = [];

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
        this.question = q;
        this.code = (q as any).functionSignature || '';
        this.markdownContent = q.descriptionMd || '';
        this.testCases = (q as any).testCases || [];
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
    if (this.testCases.length === 0) return;
    const activeTest = this.testCases[this.selectedCase - 1];
    this.testResults = {
      status: 'Accepted',
      runtime: '45ms',
      output: activeTest.expectedOutput || activeTest.expected
    };
  }

  submitCode(): void {
    alert('Submitting Code to Logithm...');
  }

}