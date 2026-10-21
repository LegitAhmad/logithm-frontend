import { Component, OnInit, signal, inject } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuestionsService, Difficulty, Checker, CreateQuestionPayload } from '../../services/questions.service';
import { AssignmentsService } from '../../services/assignments.service';
import { apiError, parseContract, parseTestCases } from '../../services/coding-contract';

@Component({
  selector: 'app-problem-creation-page',
  imports: [Navbar, FormsModule, MarkdownModule, RouterLink],
  templateUrl: './problem-creation-page.html',
  styleUrl: './problem-creation-page.css',
})
export class ProblemCreationPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly questionsService = inject(QuestionsService);
  private readonly assignmentsService = inject(AssignmentsService);
  assignmentId: string | null = null;
  questionId: string | null = null;
  readonly savedQuestionId = signal<string | null>(null);
  readonly title = signal('');
  readonly markdownContent = signal('# Add two integers\n\nReturn the sum of a and b.');
  readonly isPreviewMode = signal(false);
  readonly executionJson = signal(JSON.stringify({ functionName: 'add', parameters: [{ name: 'a', type: { type: 'integer' } }, { name: 'b', type: { type: 'integer' } }], returnType: { type: 'integer' } }, null, 2));
  readonly testCasesJson = signal(JSON.stringify([{ input: [5, 10], expectedOutput: 15, isHidden: false, points: 1 }, { input: [0, 0], expectedOutput: 0, isHidden: true, points: 1 }], null, 2));
  readonly difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard'];
  readonly selectedDifficulty = signal<Difficulty>('easy');
  readonly isPublic = signal(false);
  readonly checkerType = signal<Checker['type']>('exact');
  readonly tolerance = signal(0.000001);
  readonly checkerCode = signal('def validate(actual, expected, args):\n    return actual == expected\n');
  readonly isSaving = signal(false);
  readonly isLoading = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly validationMessage = signal<string | null>(null);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.title.set(params.get('title') ?? '');
    this.assignmentId = params.get('assignmentId');
    this.questionId = params.get('questionId');
    if (!this.questionId) return;
    this.isLoading.set(true);
    this.questionsService.getQuestion(this.questionId).subscribe({
      next: question => {
        this.title.set(question.title);
        this.markdownContent.set(question.descriptionMd);
        if (question.execution) this.executionJson.set(JSON.stringify(question.execution, null, 2));
        this.testCasesJson.set(JSON.stringify(question.testCases.map(test => {
          let input: unknown;
          let expectedOutput: unknown;
          try { input = JSON.parse(test.input); } catch { input = test.input; }
          try { expectedOutput = JSON.parse(test.expectedOutput); } catch { expectedOutput = test.expectedOutput; }
          return { input, expectedOutput, isHidden: test.isHidden ?? false, points: test.points ?? 1 };
        }), null, 2));
        this.selectedDifficulty.set(question.difficulty);
        this.isPublic.set(question.isPublic);
        if (question.checker) {
          this.checkerType.set(question.checker.type);
          this.tolerance.set(question.checker.tolerance ?? 0.000001);
          this.checkerCode.set(question.checker.code ?? this.checkerCode());
        }
        this.isLoading.set(false);
        if (!question.execution) this.saveError.set('This problem needs a typed function contract. Update its contract and convert each input to a JSON arguments array before saving.');
      },
      error: error => { this.saveError.set(apiError(error)); this.isLoading.set(false); },
    });
  }

  formatJson(): void {
    try {
      this.testCasesJson.set(JSON.stringify(JSON.parse(this.testCasesJson()), null, 2));
      this.executionJson.set(JSON.stringify(JSON.parse(this.executionJson()), null, 2));
      this.validationMessage.set('JSON formatted. Validate the contract before saving.');
      this.saveError.set(null);
    } catch (error) { this.saveError.set(error instanceof Error ? error.message : 'Invalid JSON.'); }
  }

  verifySchema(): void {
    this.validationMessage.set(null);
    this.saveError.set(null);
    try {
      const execution = parseContract(this.executionJson());
      const tests = parseTestCases(this.testCasesJson(), execution);
      this.validationMessage.set(`${tests.length} test cases match the function contract. The server validates again when saved.`);
    } catch (error) { this.saveError.set(error instanceof Error ? error.message : 'Invalid contract.'); }
  }

  saveProblem(): void {
    if (this.isSaving() || this.isLoading() || this.savedQuestionId()) return;
    this.saveError.set(null);
    let payload: CreateQuestionPayload;
    try {
      if (this.title().trim().length < 3) throw new Error('Title must be at least 3 characters.');
      if (this.markdownContent().trim().length < 10) throw new Error('Describe the problem in at least 10 characters.');
      const execution = parseContract(this.executionJson());
      const testCases = parseTestCases(this.testCasesJson(), execution);
      const checker: Checker = { type: this.checkerType() };
      if (checker.type === 'float') {
        if (!Number.isFinite(this.tolerance()) || this.tolerance() < 0) throw new Error('Tolerance must be a non-negative, finite number.');
        if (!['number', 'integer'].includes(execution.returnType.type)) throw new Error('Numeric tolerance requires a number or integer return type.');
        checker.tolerance = this.tolerance();
      }
      if (checker.type === 'custom') {
        if (!this.checkerCode().trim()) throw new Error('Provide a Python validate(actual, expected, args) function.');
        checker.code = this.checkerCode();
      }
      payload = { title: this.title().trim(), descriptionMd: this.markdownContent(), functionSignature: `${execution.functionName}(${execution.parameters.map(parameter => parameter.name).join(', ')})`, execution, testCases, checker, difficulty: this.selectedDifficulty(), isPublic: this.isPublic() };
    } catch (error) { this.saveError.set(error instanceof Error ? error.message : 'Invalid problem configuration.'); return; }
    this.isSaving.set(true);
    const request = this.questionId ? this.questionsService.updateQuestion(this.questionId, payload) : this.questionsService.createQuestion(payload);
    request.subscribe({
      next: question => {
        this.savedQuestionId.set(question._id);
        if (this.questionId || !this.assignmentId) {
          this.isSaving.set(false);
          void this.router.navigate(['/problem-detail', question._id]);
        } else this.attachSavedProblem();
      },
      error: error => { this.saveError.set(apiError(error)); this.isSaving.set(false); },
    });
  }

  attachSavedProblem(): void {
    const questionId = this.savedQuestionId();
    const assignmentId = this.assignmentId;
    if (!questionId || !assignmentId) return;
    this.isSaving.set(true);
    this.saveError.set(null);
    this.assignmentsService.getAssignment(assignmentId).subscribe({
      next: assignment => {
        if (assignment.status !== 'draft') {
          this.saveError.set('Problem saved to your bank, but this assignment is published. Unpublish it before adding the problem.');
          this.isSaving.set(false);
          return;
        }
        this.assignmentsService.updateAssignment(assignmentId, { questionIds: [...new Set([...assignment.questionIds, questionId])] }).subscribe({
          next: () => { this.isSaving.set(false); void this.router.navigate(['/assignment', assignmentId]); },
          error: error => { this.isSaving.set(false); this.saveError.set(`Problem saved, but linking failed: ${apiError(error)}`); },
        });
      },
      error: error => { this.isSaving.set(false); this.saveError.set(`Problem saved, but linking failed: ${apiError(error)}`); },
    });
  }

  onCancel(): void {
    void this.router.navigate(this.assignmentId ? ['/assignment', this.assignmentId] : ['/problems']);
  }
}
