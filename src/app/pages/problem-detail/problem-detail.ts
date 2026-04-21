import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { Navbar } from '../../components/navbar/navbar';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
export class ProblemDetail {
  isBrowser: boolean = false;
  code: string = `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        return [0, 1]`;

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

  markdownPath = 'assets/problems/two-sum.md';
  testResults: any = null;
  selectedCase = 1;

  testCases = [
    { id: 1, input: '[2, 7, 11, 15]', target: 9, expected: '[0, 1]' },
    { id: 2, input: '[3, 2, 4]', target: 6, expected: '[1, 2]' },
    { id: 3, input: '[3, 3]', target: 6, expected: '[0, 1]' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);

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
    const activeTest = this.testCases[this.selectedCase - 1];
    this.testResults = {
      status: 'Accepted',
      runtime: '45ms',
      output: activeTest.expected
    };
  }

  submitCode(): void {
    alert('Submitting Code to Logithm...');
  }

}