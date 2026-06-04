import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Question {
  _id: string;
  title: string;
  descriptionMd: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  acceptance?: string;
  status?: 'solved' | 'pending' | 'todo';
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/questions`;

  getAllQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(this.baseUrl);
  }

  getAssignmentQuestions(assignmentId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.baseUrl}/assignment/${assignmentId}`);
  }

  getQuestion(id: string): Observable<Question> {
    return this.http.get<Question>(`${this.baseUrl}/${id}`);
  }
}
