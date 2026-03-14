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
  selectedPeople = signal<any[]>([]);
  
  // Track the highlighted index for keyboard navigation
  activeSelectionIndex = signal(0);

  availableUsers = [
    { email: 'nazeefulhaq@gmail.com', initial: 'N' },
    { email: 'samyan@logithm.com', initial: 'S' },
    { email: 'affan@uet.edu.pk', initial: 'A' }
  ];

  filteredSuggestions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return [];
    return this.availableUsers.filter(user => 
      user.email.toLowerCase().includes(query) && 
      !this.selectedPeople().some(p => p.email === user.email)
    );
  });

  // Handle Keyboard Events: Up, Down, Enter, Backspace
  handleKeyboard(event: KeyboardEvent) {
    const suggestions = this.filteredSuggestions();
    
    if (event.key === 'ArrowDown') {
      this.activeSelectionIndex.update(i => (i + 1) % suggestions.length);
    } 
    else if (event.key === 'ArrowUp') {
      this.activeSelectionIndex.update(i => (i - 1 + suggestions.length) % suggestions.length);
    } 
    else if (event.key === 'Enter' && suggestions.length > 0) {
      this.selectUser(suggestions[this.activeSelectionIndex()]);
    } 
    else if (event.key === 'Backspace' && this.searchQuery() === '' && this.selectedPeople().length > 0) {
      // Deletes the last person if the input is empty
      this.selectedPeople.update(prev => prev.slice(0, -1));
    }
  }

  selectUser(user: any) {
    this.selectedPeople.update(prev => [...prev, user]);
    this.searchQuery.set('');
    this.activeSelectionIndex.set(0);
  }

  removeUser(email: string) {
    this.selectedPeople.update(prev => prev.filter(u => u.email !== email));
  }

  duration = computed(() => {
    if (!this.startDate() || !this.endDate()) return '0 months';
    const start = new Date(this.startDate());
    const end = new Date(this.endDate());
    const diff = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${diff} months`;
  });

  onCancel() { this.close.emit(); }
}
