import { Component, OnInit, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { Navbar } from '../../components/navbar/navbar';
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AssignmentsService } from '../../services/assignments.service';
import { CoursesService, Course } from '../../services/courses.service';
import { QuestionsService, Question } from '../../services/questions.service';

@Component({
  selector: 'app-assignment-creation-page',
  standalone: true,
  imports: [Navbar, FormsModule, CommonModule],
  templateUrl: './assignment-creation-page.html',
  styleUrl: './assignment-creation-page.css',
})
export class AssignmentCreationPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignmentsService = inject(AssignmentsService);
  private coursesService = inject(CoursesService);
  private questionsService = inject(QuestionsService);
  private platformId = inject(PLATFORM_ID);

  // Form fields
  title = signal('');
  description = signal('');
  startDate = signal('');
  startTime = signal('');
  dueDate = signal('');
  dueTime = signal('');

  // Selections
  selectedQuestions = signal<Question[]>([]);
  selectedCourseIds = signal<string[]>([]);

  // Available data
  allCourses = signal<Course[]>([]);
  allQuestions = signal<Question[]>([]);

  // UI state
  isPickerOpen = signal(false);
  pickerSearch = signal('');
  pickerDifficulty = signal<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  courseSearch = signal('');
  isSaving = signal(false);
  saveError = signal('');

  preselectedCourseId: string | null = null;

  readonly difficulties: Array<'All' | 'Easy' | 'Medium' | 'Hard'> = ['All', 'Easy', 'Medium', 'Hard'];

  filteredPickerQuestions = computed(() => {
    const selected = new Set(this.selectedQuestions().map(q => q._id));
    let qs = this.allQuestions().filter(q => !selected.has(q._id));
    const search = this.pickerSearch().toLowerCase().trim();
    const diff = this.pickerDifficulty();
    if (search) qs = qs.filter(q => q.title.toLowerCase().includes(search));
    if (diff !== 'All') qs = qs.filter(q => q.difficulty === diff);
    return qs;
  });

  filteredCourses = computed(() => {
    const search = this.courseSearch().toLowerCase().trim();
    if (!search) return this.allCourses();
    return this.allCourses().filter(c => c.name.toLowerCase().includes(search));
  });

  canPublish = computed(() =>
    this.title().trim().length > 0 && this.selectedCourseIds().length > 0
  );

  canDraft = computed(() => this.title().trim().length > 0);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.preselectedCourseId = this.route.snapshot.queryParamMap.get('courseId');
      if (this.preselectedCourseId) {
        this.selectedCourseIds.set([this.preselectedCourseId]);
      }
      this.loadCourses();
      this.loadQuestions();
    }
  }

  loadCourses() {
    this.coursesService.getCourses(100, 0).subscribe({
      next: res => this.allCourses.set(res.data),
      error: err => console.error('Error loading courses', err),
    });
  }

  loadQuestions() {
    this.questionsService.getAllQuestions().subscribe({
      next: qs => this.allQuestions.set(qs),
      error: err => console.error('Error loading questions', err),
    });
  }

  openPicker() { this.isPickerOpen.set(true); }
  closePicker() { this.isPickerOpen.set(false); }

  addQuestion(q: Question) {
    this.selectedQuestions.update(list => [...list, q]);
  }

  removeQuestion(id: string) {
    this.selectedQuestions.update(list => list.filter(q => q._id !== id));
  }

  toggleCourse(courseId: string) {
    this.selectedCourseIds.update(ids =>
      ids.includes(courseId) ? ids.filter(id => id !== courseId) : [...ids, courseId]
    );
    this.saveError.set('');
  }

  isCourseSelected(courseId: string): boolean {
    return this.selectedCourseIds().includes(courseId);
  }

  saveAsDraft() {
    if (!this.canDraft()) return;
    this.save('draft');
  }

  publish() {
    if (!this.title().trim()) {
      this.saveError.set('Assignment title is required.');
      return;
    }
    if (this.selectedCourseIds().length === 0) {
      this.saveError.set('Link at least one course before publishing.');
      return;
    }
    this.save('published');
  }

  private save(status: 'draft' | 'published') {
    this.isSaving.set(true);
    this.saveError.set('');

    const payload: any = {
      title: this.title().trim(),
      status,
      courseIds: this.selectedCourseIds(),
      questionIds: this.selectedQuestions().map(q => q._id),
    };

    const desc = this.description().trim();
    if (desc) payload.description = desc;

    if (this.startDate() && this.startTime()) {
      payload.startAt = new Date(`${this.startDate()}T${this.startTime()}`).toISOString();
    }
    if (this.dueDate() && this.dueTime()) {
      payload.dueAt = new Date(`${this.dueDate()}T${this.dueTime()}`).toISOString();
    }

    this.assignmentsService.createAssignment(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        const returnTo = this.preselectedCourseId ?? this.selectedCourseIds()[0];
        this.router.navigate(returnTo ? ['/course', returnTo] : ['/dashboard']);
      },
      error: err => {
        console.error('Error saving assignment', err);
        this.saveError.set('Something went wrong. Please try again.');
        this.isSaving.set(false);
      },
    });
  }

  goBack() {
    const returnTo = this.preselectedCourseId;
    this.router.navigate(returnTo ? ['/course', returnTo] : ['/dashboard']);
  }

  difficultyClass(diff: string): string {
    switch (diff) {
      case 'Easy':   return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'Hard':   return 'text-red-400 bg-red-400/10';
      default:       return 'text-gray-400 bg-gray-400/10';
    }
  }
}
