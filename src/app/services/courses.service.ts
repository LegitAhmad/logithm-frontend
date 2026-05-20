import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
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
      .get<any>(this.baseUrl, {
        params: { limit, offset },
      })
      .pipe(
        map((response) => {
          // Handle both wrapped { data: [] } and direct [] responses
          let courses: Course[] = [];
          if (response && Array.isArray(response)) {
            courses = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            courses = response.data;
          } else if (response && response.courses && Array.isArray(response.courses)) {
            courses = response.courses;
          }

          return {
            limit: response?.limit ?? limit,
            offset: response?.offset ?? offset,
            data: courses.map((course) => ({
              ...course,
              creator: undefined, // will be enriched below
            })),
          };
        }),
        catchError((err) => {
          console.error('CoursesService: Error in getCourses', err);
          return of({ limit, offset, data: [] });
        }),
      );
  }

  favoriteCourse(courseId: string): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/${courseId}/favorite`, {});
  }

  unfavoriteCourse(courseId: string): Observable<Course> {
    return this.http.delete<Course>(`${this.baseUrl}/${courseId}/favorite`);
  }

  createCourse(courseData: {
    name: string;
    instructorName?: string;
    startDate: string;
    endDate: string;
  }): Observable<Course> {
    console.log('CoursesService: Creating course:', courseData);
    return this.http.post<any>(this.baseUrl, courseData).pipe(
      map((response) => {
        console.log('CoursesService: Raw createCourse response:', response);
        // Handle potential wrapped response { course: { ... } }
        const course = response?.course || response;
        console.log('CoursesService: Resolved course object:', course);
        return course;
      }),
      catchError((err) => {
        console.error('CoursesService: Failed to create course', err);
        throw err;
      }),
    );
  }

  enrichCoursesWithCreators(courses: Course[]): Observable<Course[]> {
    console.log('CoursesService: Enriching courses, count:', courses.length);
    if (!courses || courses.length === 0) {
      return of([]);
    }

    // Create an array of observables for fetching user data
    const userRequests: Observable<Course>[] = courses.map((course) =>
      this.getUser(course.creatorId).pipe(
        map((user) => ({
          ...course,
          creator: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })),
        // If a user request fails, we still want to show the course
        catchError((err: any) => {
          console.error(`CoursesService: Failed to fetch creator for course ${course._id}`, err);
          return of({
            ...course,
            creator: { firstName: 'Unknown', lastName: 'Instructor' },
          } as Course);
        }),
      ),
    );

    // Execute all requests in parallel and combine results
    return forkJoin(userRequests).pipe(
      map((enrichedCourses) => {
        console.log('CoursesService: Enrichment complete, count:', enrichedCourses.length);
        return enrichedCourses;
      }),
    );
  }

  private getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${userId}`);
  }
}
