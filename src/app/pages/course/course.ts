import { Component, signal, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Assignment, QuestionBreakdown } from './models';
import {
  LucideAngularModule,
  BookOpen,
  BarChart2,
  Clock,
  Trophy,
  GraduationCap,
  Calendar,
  Award,
  XCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './course.html',
})
export class Course {
  // Readonly icon properties for template binding
  readonly BookOpen = BookOpen;
  readonly BarChart2 = BarChart2;
  readonly Clock = Clock;
  readonly Trophy = Trophy;
  readonly GraduationCap = GraduationCap;
  readonly Calendar = Calendar;
  readonly Award = Award;
  readonly XCircle = XCircle;

  tabs: ('All' | 'Pending' | 'Submitted' | 'Overdue')[] = [
    'All',
    'Pending',
    'Submitted',
    'Overdue',
  ];

  // Signals for state management
  activeTab = signal<'All' | 'Pending' | 'Submitted' | 'Overdue'>('All');

  assignments = signal<Assignment[]>([
    {
      id: 1,
      title: 'Binary Search Implementation',
      dueDate: '2026-02-15',
      marks: 50,
      solved: 2,
      totalQuestions: 5,
      progress: 40,
      status: 'Pending',
      attempts: 1,
      score: null,
    },
    {
      id: 2,
      title: 'Dynamic Programming Basics',
      dueDate: '2026-02-10',
      marks: 80,
      solved: 4,
      totalQuestions: 4,
      progress: 100,
      status: 'Submitted',
      attempts: 2,
      score: 78,
    },
    {
      id: 3,
      title: 'Graph Traversal Algorithms',
      dueDate: '2026-02-08',
      marks: 60,
      solved: 1,
      totalQuestions: 3,
      progress: 33,
      status: 'Overdue',
      attempts: 0,
      score: null,
    },
  ]);

  selectedAssignment = signal<Assignment | null>(this.assignments()[0]);

  // Computed Signal for filtering
  filteredAssignments: Signal<Assignment[]> = computed(() => {
    const tab = this.activeTab();
    const all = this.assignments();
    return tab === 'All' ? all : all.filter((a) => a.status === tab);
  });

  questionBreakdown: QuestionBreakdown[] = [
    { id: 1, title: 'BFS Implementation', marks: 20, score: null },
    { id: 2, title: 'DFS Implementation', marks: 20, score: null },
    { id: 3, title: 'Shortest Path (Dijkstra)', marks: 20, score: null },
  ];

  setTab(tab: 'All' | 'Pending' | 'Submitted' | 'Overdue') {
    this.activeTab.set(tab);
    const filtered = this.filteredAssignments();
    this.selectedAssignment.set(filtered.length ? filtered[0] : null);
  }

  selectAssignment(assignment: Assignment) {
    this.selectedAssignment.set(assignment);
  }

  getAssignmentCount(tab: 'All' | 'Pending' | 'Submitted' | 'Overdue'): number {
    if (tab === 'All') return this.assignments().length;
    return this.assignments().filter((a) => a.status === tab).length;
  }

  isDeadlinePassed(assignment: Assignment): boolean {
    const today = new Date();
    const due = new Date(assignment.dueDate);
    return today > due;
  }
}
