import { Component, OnInit, signal, inject } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionsService, Difficulty } from '../../services/questions.service';
import { AssignmentsService } from '../../services/assignments.service';

@Component({
  selector: 'app-problem-creation-page',
  imports: [Navbar, FormsModule, MarkdownModule],
  templateUrl: './problem-creation-page.html',
  styleUrl: './problem-creation-page.css',
})
export class ProblemCreationPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private questionsService = inject(QuestionsService);
  private assignmentsService = inject(AssignmentsService);

  // Set when opened from an assignment's "Add Problem" button — the newly
  // created question gets attached to this assignment on save.
  assignmentId: string | null = null;

  title = signal('');
  functionSignature = signal('');
  markdownContent = signal('# New Problem Statement\n\nWrite your description here...');
  isPreviewMode = signal(false);

  testCasesJson = signal('[\n  {\n    "input": "5 10",\n    "target": "15",\n    "isHidden": false\n  }\n]');
  readonly difficultyOptions: ReadonlyArray<'Easy' | 'Medium' | 'Hard'> = ['Easy', 'Medium', 'Hard'];
  selectedDifficulty = signal<'Easy' | 'Medium' | 'Hard'>('Easy');

  isSaving = signal(false);
  saveError = signal<string | null>(null);

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    this.title.set(params.get('title') ?? '');
    this.assignmentId = params.get('assignmentId');
  }

  // Format the JSON with 2-space indentation
  formatJson() {
    try {
      const obj = JSON.parse(this.testCasesJson());
      this.testCasesJson.set(JSON.stringify(obj, null, 2));
    } catch (e) {
      alert('Invalid JSON! Please fix errors before formatting.');
    }
  }


  verifySchema() {
  const jsonString = this.testCasesJson().trim();

  // 1. Check if empty
  if (!jsonString) {
    alert("The editor is empty. Please add some JSON.");
    return;
  }

  try {
    // 2. The Actual Check
    const parsedData = JSON.parse(jsonString);

    // 3. Check if it's an Array (as required for test cases)
    if (!Array.isArray(parsedData)) {
      alert("Format Error: Your JSON should start with '[' and end with ']'. It must be an array of objects.");
      return;
    }

    // 4. Check internal structure (Optional but recommended)
    if (parsedData.length > 0 && (!parsedData[0].input || !parsedData[0].target)) {
      alert("Schema Warning: Your objects are missing the required 'input' or 'target' fields.");
      return;
    }

    alert("Success! The JSON is perfectly formatted.");

  } catch (error) {
    // 5. Catch Syntax Errors (missing commas, quotes, etc.)
    console.error("JSON Error:", error);
    alert("Invalid JSON: There is a syntax error in your code. Check for missing quotes or extra commas.");
  }
}

  togglePreview() {
    this.isPreviewMode.update(val => !val);
  }

  saveProblem() {
    if (this.isSaving()) return;
    this.saveError.set(null);

    const title = this.title().trim();
    const functionSignature = this.functionSignature().trim();

    if (title.length < 3) {
      this.saveError.set('Title must be at least 3 characters.');
      return;
    }

    if (functionSignature.length < 3) {
      this.saveError.set('Function signature is required.');
      return;
    }

    let rawTestCases: Array<{ input: string; target: string; isHidden?: boolean }>;
    try {
      rawTestCases = JSON.parse(this.testCasesJson());
      if (!Array.isArray(rawTestCases) || rawTestCases.length === 0) {
        throw new Error('Test cases must be a non-empty JSON array.');
      }
    } catch {
      this.saveError.set('Test cases must be valid, non-empty JSON — click "Verify Schema" to check.');
      return;
    }

    const testCases = rawTestCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.target,
      isHidden: tc.isHidden ?? false,
      points: 1,
    }));

    if (testCases.some((tc) => !tc.input || !tc.expectedOutput)) {
      this.saveError.set('Every test case needs both "input" and "target".');
      return;
    }

    this.isSaving.set(true);

    this.questionsService
      .createQuestion({
        title,
        descriptionMd: this.markdownContent(),
        functionSignature,
        testCases,
        difficulty: this.selectedDifficulty().toLowerCase() as Difficulty,
        isPublic: true,
      })
      .subscribe({
        next: (question) => this.attachToAssignmentAndLeave(question._id),
        error: (err) => {
          console.error('Error creating question', err);
          this.saveError.set('Failed to save the problem. Please try again.');
          this.isSaving.set(false);
        },
      });
  }

  private attachToAssignmentAndLeave(questionId: string) {
    const assignmentId = this.assignmentId;
    if (!assignmentId) {
      this.isSaving.set(false);
      void this.router.navigate(['/dashboard']);
      return;
    }

    this.assignmentsService.getAssignment(assignmentId).subscribe({
      next: (assignment) => {
        if (assignment.status !== 'draft') {
          // Only drafts can be edited — the question is saved to the bank,
          // but linking it to an already-published assignment isn't possible.
          alert(
            'The problem was saved, but this assignment is already published and can no longer be edited. ' +
              'It was not added to the assignment.',
          );
          this.isSaving.set(false);
          void this.router.navigate(['/assignment', assignmentId]);
          return;
        }

        this.assignmentsService
          .updateAssignment(assignmentId, {
            questionIds: [...assignment.questionIds, questionId],
          })
          .subscribe({
            next: () => {
              this.isSaving.set(false);
              void this.router.navigate(['/assignment', assignmentId]);
            },
            error: (err) => {
              console.error('Question created, but failed to attach it to the assignment', err);
              alert('The problem was saved, but could not be attached to the assignment. Please try again.');
              this.isSaving.set(false);
              void this.router.navigate(['/assignment', assignmentId]);
            },
          });
      },
      error: (err) => {
        console.error('Question created, but failed to load the assignment', err);
        alert('The problem was saved, but could not be attached to the assignment. Please try again.');
        this.isSaving.set(false);
        void this.router.navigate(['/assignment', assignmentId]);
      },
    });
  }

  onCancel() {
    void this.router.navigate(this.assignmentId ? ['/assignment', this.assignmentId] : ['/dashboard']);
  }
}
