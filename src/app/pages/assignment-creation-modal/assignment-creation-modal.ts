import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-assignment-creation-modal',
  imports: [FormsModule],
  templateUrl: './assignment-creation-modal.html',
  styleUrl: './assignment-creation-modal.css',
})
export class AssignmentCreationModal {
  @Output() close = new EventEmitter<void>();

  assignmentName = signal('');

  onCancel() {
    this.close.emit();
  }

  onCreate() {
    if (this.assignmentName().trim()) {
      console.log('Assignment logic triggered:', this.assignmentName());
      this.close.emit();
    }
  }
}
