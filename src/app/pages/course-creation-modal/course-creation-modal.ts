import { Component, EventEmitter, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-creation-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './course-creation-modal.html',
  styleUrl: './course-creation-modal.css',
})
export class CourseCreationModal {
@Output() close = new EventEmitter<void>();

  searchQuery = signal('');
  startDate = signal('');
  endDate = signal('');
  
  // Example data for the search dropdown
  availableUsers = [
    { email: 'nazeefulhaq@gmail.com', initial: 'A' },
    { email: 'samyan@logithm.com', initial: 'S' }
  ];

  selectedPeople = signal([
    { email: 'nazeefulhaq@gmail.com', role: 'TA', initial: 'A' }
  ]);

  duration = computed(() => {
    if (!this.startDate() || !this.endDate()) return '0 months';
    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${diff} months`;
  });

  addPerson(user: any) {
    if (!this.selectedPeople().find(p => p.email === user.email)) {
      this.selectedPeople.update(p => [...p, { ...user, role: 'Viewer' }]);
    }
    this.searchQuery.set('');
  }

  removePerson(email: string) {
    this.selectedPeople.update(p => p.filter(item => item.email !== email));
  }

  onCancel() { this.close.emit(); }
}
