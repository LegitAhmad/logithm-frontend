import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-problem-creation-modal',
  imports: [FormsModule],
  templateUrl: './problem-creation-modal.html',
  styleUrl: './problem-creation-modal.css',
})
export class ProblemCreationModal {
  @Output() close = new EventEmitter<void>();

  problemTitle = signal('');

  onCancel() {
    this.close.emit();
  }

  onCreate() {
    if (this.problemTitle().trim()) {
      console.log('Creating Problem:', this.problemTitle());
      // Logic to navigate or save would go here
      this.close.emit();
    }
  }
}
