import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-testimonials',
  imports: [CommonModule],
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.css',
})
export class Testimonials {
  // Signal to track the current active index
  currentIndex = signal(0);

  reviews = [
    {
      name: 'Anas Sabir',
      role: 'Student',
      text: 'Logithm has been the ultimate boost to my workflow. It’s a breeze to submit my assignments!',
      image: '/anas.webp',
    },
    {
      name: 'Samyam Wahla',
      role: 'Teacher',
      text: 'Automating test cases has saved me hours of manual grading every week.',
      image: '/t1.webp',
    },
  ];

  // Computed signal for the current review object
  currentReview = computed(() => this.reviews[this.currentIndex()]);

  next() {
    this.currentIndex.update((i) => (i + 1) % this.reviews.length);
  }

  prev() {
    this.currentIndex.update((i) => (i - 1 + this.reviews.length) % this.reviews.length);
  }

  setIndex(index: number) {
    this.currentIndex.set(index);
  }
}
