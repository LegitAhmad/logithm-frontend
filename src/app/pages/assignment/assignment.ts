import { Component, OnInit, computed, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Navbar } from '../../components/navbar/navbar';
import { RouterLink, ActivatedRoute } from "@angular/router";
import { ProblemCreationModal } from '../problem-creation-modal/problem-creation-modal';
import { AssignmentsService, Assignment as AssignmentData } from '../../services/assignments.service';
import { QuestionsService, Question } from '../../services/questions.service';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [Navbar, CommonModule, RouterLink, ProblemCreationModal],
  templateUrl: './assignment.html',
  styleUrl: './assignment.css',
})
export class Assignment implements OnInit {
  private route = inject(ActivatedRoute);
  private assignmentsService = inject(AssignmentsService);
  private questionsService = inject(QuestionsService);
  private platformId = inject(PLATFORM_ID);

  assignmentId: string | null = null;
  assignment = signal<AssignmentData | null>(null);
  allQuestions = signal<Question[]>([]);
  isPublishing = signal(false);

  isModalOpen = signal(false);
  isHovered = false;
  selectedCategory = signal('All Topics');
  categories = signal<string[]>(['All Topics']);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.assignmentId = this.route.snapshot.paramMap.get('id');
      if (this.assignmentId) {
        this.fetchAssignment();
        this.fetchQuestions();
      }
    }
  }

  fetchAssignment() {
    if (!this.assignmentId) return;
    this.assignmentsService.getAssignment(this.assignmentId).subscribe({
      next: (data) => this.assignment.set(data),
      error: (err) => console.error('Error fetching assignment', err)
    });
  }

  fetchQuestions() {
    if (!this.assignmentId) return;
    this.questionsService.getAssignmentQuestions(this.assignmentId).subscribe({
      next: (questions) => {
        this.allQuestions.set(questions);
        this.updateCategories(questions);
      },
      error: (err) => console.error('Error fetching questions', err)
    });
  }

  updateCategories(questions: Question[]) {
    const cats = new Set<string>(['All Topics']);
    questions.forEach(q => {
      if (q.tags && q.tags.length > 0) {
        q.tags.forEach(tag => cats.add(tag));
      }
    });
    this.categories.set(Array.from(cats));
  }

  publishAssignment() {
    if (!this.assignmentId || this.isPublishing()) return;

    this.isPublishing.set(true);
    this.assignmentsService.publishAssignment(this.assignmentId).subscribe({
      next: (updated) => {
        this.assignment.set(updated);
        this.isPublishing.set(false);
      },
      error: (err) => {
        console.error('Error publishing assignment', err);
        this.isPublishing.set(false);
      },
    });
  }

  openAddProblemPopup() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.fetchQuestions();
  }

  readonly filteredQuestions = computed(() => {
    const category = this.selectedCategory();
    const questions = this.allQuestions();
    if (category === 'All Topics') return questions;
    return questions.filter((q) => q.tags?.includes(category));
  });

  // Statistics data
  stats = {
    totalSolved: 0,
    totalQuestions: 0,
    easy: { solved: 0, total: 0 },
    medium: { solved: 0, total: 0 },
    hard: { solved: 0, total: 0 },
    streak: 0
  };

  // Logic to calculate progress bar percentages dynamically
  getProgressWidth(solved: number, total: number): string {
    if (total === 0) return '0%';
    return `${(solved / total) * 100}%`;
  }

  // Helper for status colors
  getStatusColor(status?: string): string {
    switch (status) {
      case 'solved': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-gray-600';
    }
  }

  // Method to change category from the UI
  setCategory(category: string) {
    this.selectedCategory.set(category);
  }
}
