import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Course {
  _id: string;
  name: string;
  creatorId: string;
  creator?: { firstName: string; lastName: string };
  isFavorite?: boolean;
}

export interface PaginatedCourseResponse {
  limit: number;
  offset: number;
  data: Course[];
}

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl + '/courses';
  private usersUrl = environment.apiBaseUrl + '/users';

  getCourses(limit = 10, offset = 0): Observable<PaginatedCourseResponse> {
    return this.http
      .get<PaginatedCourseResponse>(this.baseUrl, {
        params: { limit, offset },
      })
      .pipe(
        map((response) => ({
          ...response,
          data: response.data.map((course) => ({
            ...course,
            creator: undefined, // will be enriched below
          })),
        })),
      );
  }

  favoriteCourse(courseId: string): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/${courseId}/favorite`, {});
  }

  unfavoriteCourse(courseId: string): Observable<Course> {
    return this.http.delete<Course>(`${this.baseUrl}/${courseId}/favorite`);
  }

  enrichCoursesWithCreators(courses: Course[]): Observable<Course[]> {
    if (!courses || courses.length === 0) {
      return of([]);
    }

    // Create an array of observables for fetching user data
    const userRequests = courses.map((course) =>
      this.getUser(course.creatorId).pipe(
        map((user) => ({
          ...course,
          creator: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })),
      ),
    );

    // Execute all requests in parallel and combine results
    return forkJoin(userRequests);
  }

  private getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${userId}`);
  }
}
