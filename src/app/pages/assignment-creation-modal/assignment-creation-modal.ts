import { Component, EventEmitter, Output, Input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AssignmentsService } from '../../services/assignments.service';

@Component({
  selector: 'app-assignment-creation-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './assignment-creation-modal.html',
  styleUrl: './assignment-creation-modal.css',
})
export class AssignmentCreationModal {
  @Input() courseId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() assignmentCreated = new EventEmitter<void>();

  private assignmentsService = inject(AssignmentsService);
  assignmentTitle = signal('');

  onCancel() {
    this.close.emit();
  }

  onCreate() {
    if (this.assignmentTitle().trim() && this.courseId) {
      this.assignmentsService.createAssignment({
        title: this.assignmentTitle().trim(),
        courseId: this.courseId,
        status: 'published'
      }).subscribe({
        next: () => {
          this.assignmentCreated.emit();
          this.close.emit();
        },
        error: (err) => console.error('Error creating assignment', err)
      });
    }
  }
}
