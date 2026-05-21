import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
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
  assignment: AssignmentData | null = null;
  allQuestions: Question[] = [];
  
  isModalOpen: boolean = false;
  isHovered = false;
  selectedCategory = 'All Topics';
  categories: string[] = ['All Topics'];

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
      next: (data) => this.assignment = data,
      error: (err) => console.error('Error fetching assignment', err)
    });
  }

  fetchQuestions() {
    if (!this.assignmentId) return;
    this.questionsService.getAssignmentQuestions(this.assignmentId).subscribe({
      next: (questions) => {
        this.allQuestions = questions;
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
    this.categories = Array.from(cats);
  }

  openAddProblemPopup() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.fetchQuestions();
  }

  // This getter ensures the template always has the filtered list
  get filteredQuestions() {
    if (this.selectedCategory === 'All Topics') return this.allQuestions;
    return this.allQuestions.filter(q => q.tags?.includes(this.selectedCategory));
  }

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
    this.selectedCategory = category;
  }
}