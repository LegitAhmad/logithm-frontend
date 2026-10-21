import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AssignmentsService } from '../../services/assignments.service';

@Component({ selector: 'app-assignment-creation-modal', imports: [FormsModule], templateUrl: './assignment-creation-modal.html', styleUrl: '../product-pages.css', host: {'(document:keydown.escape)':'onCancel()'} })
export class AssignmentCreationModal {
  @Input() courseId: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() assignmentCreated = new EventEmitter<void>();
  private readonly assignments = inject(AssignmentsService);
  private readonly router = inject(Router);
  assignmentTitle = '';
  description = '';
  readonly saving = signal(false);
  readonly error = signal('');
  onCancel() { if (!this.saving()) this.close.emit(); }
  onCreate() {
    if (this.saving() || !this.courseId) return;
    if (this.assignmentTitle.trim().length < 3) { this.error.set('Enter a title of at least three characters.'); return; }
    this.error.set(''); this.saving.set(true);
    this.assignments.createAssignment({title:this.assignmentTitle.trim(),description:this.description.trim(),courseId:this.courseId}).subscribe({
      next: assignment => { this.saving.set(false); this.assignmentCreated.emit(); this.close.emit(); void this.router.navigate(['/assignment',assignment._id]); },
      error: () => { this.error.set('Could not create the draft assignment.'); this.saving.set(false); },
    });
  }
}
