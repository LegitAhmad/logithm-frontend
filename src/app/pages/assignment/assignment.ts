import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Required for @for, @if, and [style.width]
import { Navbar } from '../../components/navbar/navbar';

interface Question {
  id: number;
  text: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  acceptance: string;
  status: 'solved' | 'pending' | 'todo';
  category: string;
}

@Component({
  selector: 'app-assignment',
  standalone: true, // Assuming standalone based on previous context
  imports: [Navbar, CommonModule],
  templateUrl: './assignment.html',
  styleUrl: './assignment.css',
})
export class Assignment {
  isHovered = false;
  selectedCategory = 'All Topics';

  // Categories for the filter chips
  categories = ['All Topics', 'Algorithms', 'Array', 'String', 'Math', 'Dynamic Programming'];

  // Full question dataset
  allQuestions: Question[] = [
    { id: 1, text: 'Write a program to calculate factorial of any number', difficulty: 'Easy', acceptance: '71.6%', status: 'solved', category: 'Algorithms' },
    { id: 2, text: 'Implement a function to find the nth Fibonacci number', difficulty: 'Easy', acceptance: '57.1%', status: 'solved', category: 'Algorithms' },
    { id: 3, text: 'Two Sum: Find indices of two numbers that add up to target', difficulty: 'Easy', acceptance: '49.8%', status: 'todo', category: 'Array' },
    { id: 4, text: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', acceptance: '33.8%', status: 'pending', category: 'String' },
    { id: 5, text: 'Add Two Numbers: Linked List representation', difficulty: 'Medium', acceptance: '41.2%', status: 'todo', category: 'Linked List' },
    { id: 6, text: 'Median of Two Sorted Arrays', difficulty: 'Hard', acceptance: '38.5%', status: 'todo', category: 'Array' },
    { id: 7, text: 'Reverse Integer and handle overflow', difficulty: 'Easy', acceptance: '28.1%', status: 'solved', category: 'Math' },
    { id: 8, text: 'Regular Expression Matching', difficulty: 'Hard', acceptance: '28.0%', status: 'todo', category: 'Dynamic Programming' }
  ];

  // This getter ensures the template always has the filtered list
  get filteredQuestions() {
    if (this.selectedCategory === 'All Topics') return this.allQuestions;
    return this.allQuestions.filter(q => q.category === this.selectedCategory);
  }

  // Statistics data
  stats = {
    totalSolved: 42,
    totalQuestions: 150,
    easy: { solved: 25, total: 50 },
    medium: { solved: 12, total: 60 },
    hard: { solved: 5, total: 40 },
    streak: 5
  };

  // Logic to calculate progress bar percentages dynamically
  getProgressWidth(solved: number, total: number): string {
    return `${(solved / total) * 100}%`;
  }

  // Helper for status colors
  getStatusColor(status: string): string {
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