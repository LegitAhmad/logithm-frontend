import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TestCaseResult {
  testCaseIndex: number;
  isHidden: boolean;
  points: number;
  passed: boolean;
  verdict?: string;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  time?: string;
  memory?: number;
}

export interface Submission {
  _id: string;
  questionId: string;
  assignmentId?: string;
  language: string;
  mode: 'run' | 'submit';
  status: 'judging' | 'completed';
  results: TestCaseResult[];
  score: number;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionPayload {
  questionId: string;
  language: string;
  code: string;
  assignmentId?: string;
}

@Injectable({ providedIn: 'root' })
export class SubmissionsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/submissions`;

  // Runs against visible test cases only — not scored, used for the "Run" button.
  run(payload: CreateSubmissionPayload): Observable<Submission> {
    return this.http.post<Submission>(`${this.baseUrl}/run`, payload);
  }

  // Runs against every test case (including hidden) and records a score.
  submit(payload: CreateSubmissionPayload): Observable<Submission> {
    return this.http.post<Submission>(this.baseUrl, payload);
  }

  getMine(): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.baseUrl}/mine`);
  }

  getByQuestion(questionId: string): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.baseUrl}/question/${questionId}`);
  }

  getOne(id: string): Observable<Submission> {
    return this.http.get<Submission>(`${this.baseUrl}/${id}`);
  }
}
