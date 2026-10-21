import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Course, CoursesService } from '../../services/courses.service';

@Component({ selector: 'app-course-creation-modal', imports: [FormsModule], templateUrl: './course-creation-modal.html', styleUrl: '../product-pages.css', host: {'(document:keydown.escape)':'onCancel()'} })
export class CourseCreationModal {
  private readonly courses = inject(CoursesService);
  @Output() close = new EventEmitter<void>();
  @Output() courseCreated = new EventEmitter<Course>();
  courseName = '';
  startDate = '';
  endDate = '';
  readonly saving = signal(false);
  readonly error = signal('');
  onSubmit() {
    if (this.saving()) return;
    if (this.courseName.trim().length < 3 || !this.startDate || !this.endDate || this.endDate < this.startDate) {
      this.error.set('Enter a course name of at least three characters and an end date on or after the start.'); return;
    }
    this.saving.set(true); this.error.set('');
    this.courses.createCourse({name:this.courseName.trim(),startDate:new Date(this.startDate).toISOString(),endDate:new Date(this.endDate).toISOString()}).subscribe({
      next: course => { this.saving.set(false); this.courseCreated.emit(course); this.close.emit(); },
      error: () => { this.error.set('Could not create the course. Check the details and try again.'); this.saving.set(false); },
    });
  }
  onCancel() { if (!this.saving()) this.close.emit(); }
}
