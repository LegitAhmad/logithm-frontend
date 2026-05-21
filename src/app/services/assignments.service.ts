import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type AssignmentStatus = 'draft' | 'published' | 'pending' | 'active' | 'closed' | 'missed';

export interface Assignment {
  _id: string;
  title?: string;
  name?: string;
  status?: AssignmentStatus;
  dueDate?: string;
  dueTime?: string;
  dueAt?: string;
  courseId?: string;
  course?: {
    _id?: string;
    name?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AssignmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/assignments`;

  getCourseAssignments(courseId: string, status?: 'pending' | 'missed' | 'all'): Observable<Assignment[]> {
    if (status === 'all') {
      return this.http.get<Assignment[]>(this.baseUrl, { params: { courseId } });
    }
    const params = status ? { status } : undefined;

    return this.http.get<Assignment[]>(`${this.baseUrl}/course/${courseId}`, { params });
  }

  createAssignment(assignment: Partial<Assignment>): Observable<Assignment> {
    return this.http.post<Assignment>(this.baseUrl, assignment);
  }

  getAssignment(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.baseUrl}/${id}`);
  }
}