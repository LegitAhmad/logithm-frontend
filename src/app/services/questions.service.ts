import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  points?: number;
}

export interface Question {
  _id: string;
  title: string;
  descriptionMd: string;
  functionSignature: string;
  constraints?: string;
  testCases: TestCase[];
  difficulty: Difficulty;
  tags: string[];
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  acceptance?: string;
  status?: 'solved' | 'pending' | 'todo';
  category?: string;
}

export interface CreateQuestionPayload {
  title: string;
  descriptionMd: string;
  functionSignature: string;
  constraints?: string;
  testCases: TestCase[];
  difficulty: Difficulty;
  tags?: string[];
  isPublic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/questions`;

  getAssignmentQuestions(assignmentId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.baseUrl}/assignment/${assignmentId}`);
  }

  getQuestion(id: string): Observable<Question> {
    return this.http.get<Question>(`${this.baseUrl}/${id}`);
  }

  createQuestion(payload: CreateQuestionPayload): Observable<Question> {
    return this.http.post<Question>(this.baseUrl, payload);
  }
}
