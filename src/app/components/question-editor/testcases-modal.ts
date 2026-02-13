import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OutputType, TestCase } from './models';
import { MonacoEditorComponent } from '../manoca-editor/manoca-editor';

@Component({
  selector: 'app-test-case-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MonacoEditorComponent],
  templateUrl: './testcases-modal.html',
})
export class TestCaseModalComponent {
  @Input() outputType!: OutputType;
  @Input() functionLanguage!: string;
  @Input() testCase!: TestCase | null;

  @Output() save = new EventEmitter<TestCase>();
  @Output() close = new EventEmitter<void>();

  input = '';
  expected: any;

  ngOnInit() {
    if (this.testCase) {
      this.input = this.testCase.input;
      this.expected = this.testCase.expectedOutput;
    }
  }

  saveTestCase() {
    this.save.emit({
      id: this.testCase?.id || '',
      input: this.input,
      expectedOutput: this.expected,
    });
  }
}
