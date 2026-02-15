export interface Assignment {
  id: number;
  title: string;
  dueDate: string; // YYYY-MM-DD
  marks: number;
  solved: number;
  totalQuestions: number;
  progress: number;
  status: 'Pending' | 'Submitted' | 'Overdue';
  attempts: number;
  score: number | null;
}

export interface QuestionBreakdown {
  id: number;
  title: string;
  marks: number;
  score: number | null;
}
