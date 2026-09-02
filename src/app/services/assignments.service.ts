import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type AssignmentStatus = 'draft' | 'published' | 'active' | 'closed';
export type AssignmentRealStatus = 'draft' | 'pending' | 'active' | 'missed';

export interface Assignment {
  _id: string;
  title: string;
  description: string | null;
  courseId: string;
  questionIds: string[];
  status: AssignmentStatus;
  publishedAt: string | null;
  startAt: string | null;
  deadline: string | null;
  realStatus: AssignmentRealStatus;
  isActive: boolean;
  isExpired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublishAssignmentPayload {
  startAt?: string;
  deadline?: string;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  courseId: string;
  questionIds?: string[];
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  questionIds?: string[];
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

  createAssignment(assignment: CreateAssignmentPayload): Observable<Assignment> {
    return this.http.post<Assignment>(this.baseUrl, assignment);
  }

  getAssignment(id: string): Observable<Assignment> {
    return this.http.get<Assignment>(`${this.baseUrl}/${id}`);
  }

  updateAssignment(id: string, payload: UpdateAssignmentPayload): Observable<Assignment> {
    return this.http.patch<Assignment>(`${this.baseUrl}/${id}`, payload);
  }

  publishAssignment(id: string, payload: PublishAssignmentPayload = {}): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.baseUrl}/${id}/publish`, payload);
  }

  unpublishAssignment(id: string): Observable<Assignment> {
    return this.http.post<Assignment>(`${this.baseUrl}/${id}/unpublish`, {});
  }
}