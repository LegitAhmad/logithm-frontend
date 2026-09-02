import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-problem-creation-modal',
  imports: [FormsModule],
  templateUrl: './problem-creation-modal.html',
  styleUrl: './problem-creation-modal.css',
})
export class ProblemCreationModal {
  @Input() assignmentId: string | null = null;
  @Output() close = new EventEmitter<void>();

  private router = inject(Router);

  problemTitle = signal('');

  onCancel() {
    this.close.emit();
  }

  onCreate() {
    const title = this.problemTitle().trim();
    if (!title) return;

    // The full editor (description, test cases, difficulty) lives on the
    // dedicated page — carry the title (and the assignment to attach to)
    // over via query params so it isn't lost on navigation.
    void this.router.navigate(['/problem-creation'], {
      queryParams: { title, assignmentId: this.assignmentId ?? undefined },
    });
    this.close.emit();
  }
}
