import { Component, EventEmitter, Output, Input, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  private assignmentsService = inject(AssignmentsService);
  private router = inject(Router);

  assignmentTitle = signal('');
  isCreating = signal(false);

  onCancel() {
    this.close.emit();
  }

  onCreate() {
    if (!this.assignmentTitle().trim() || !this.courseId || this.isCreating()) return;

    this.isCreating.set(true);
    this.assignmentsService.createAssignment({
      title: this.assignmentTitle().trim(),
      courseId: this.courseId,
      status: 'draft',
    }).subscribe({
      next: (assignment) => {
        this.close.emit();
        this.router.navigate(['/assignment', assignment._id]);
      },
      error: (err) => {
        console.error('Error creating assignment', err);
        this.isCreating.set(false);
      },
    });
  }
}
