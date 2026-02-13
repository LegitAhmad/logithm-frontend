import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { TestCaseModalComponent } from './testcases-modal';
import { OutputType, Question, TestCase } from './models';
import { MonacoEditorComponent } from '../manoca-editor/manoca-editor';

@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorComponent, TestCaseModalComponent],
  templateUrl: './question-editor.html',
})
export class QuestionEditorComponent {
  showModal = signal(false);
  editingTestCase = signal<TestCase | null>(null);

  question = signal<Question>({
    title: '',
    description: '',
    outputType: 'string',
    functionLanguage: 'javascript',
    testCases: [],
  });

  addTestCase() {
    this.editingTestCase.set(null);
    this.showModal.set(true);
  }

  editTestCase(tc: TestCase) {
    this.editingTestCase.set(tc);
    this.showModal.set(true);
  }

  saveTestCase(testCase: TestCase) {
    const q = this.question();

    const existingIndex = q.testCases.findIndex((t) => t.id === testCase.id);

    if (existingIndex > -1) {
      q.testCases[existingIndex] = testCase;
    } else {
      q.testCases.push({ ...testCase, id: uuidv4() });
    }

    this.question.set({ ...q });
    this.showModal.set(false);
  }

  deleteTestCase(id: string) {
    const q = this.question();
    q.testCases = q.testCases.filter((t) => t.id !== id);
    this.question.set({ ...q });
  }

  updateTitle(value: string) {
    this.question.update((q) => ({
      ...q,
      title: value,
    }));
  }

  updateDescription(value: string) {
    this.question.update((q) => ({
      ...q,
      description: value,
    }));
  }
}
