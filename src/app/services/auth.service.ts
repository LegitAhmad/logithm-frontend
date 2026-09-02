import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

const ACCESS_TOKEN_KEY = 'accessToken';

export interface AuthTokens {
  accessToken: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  username?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  favoriteCourses?: Array<string | { _id: string }>;
  favoriteCourseIds?: string[];
  favorites?: Array<string | { _id: string }>;
}

type UserResponse = User | { user: User };

export interface UpdateUserPayload {
  username?: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);

  readonly accessToken = signal<string | null>(this.getInitialToken(ACCESS_TOKEN_KEY));
  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.accessToken());

  private getInitialToken(key: string): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(key) : null;
  }

  // The refresh token itself never touches JS — it lives in an httpOnly
  // cookie the backend sets/reads. We only ever persist the access token.
  private setSession(tokens: AuthTokens): void {
    this.accessToken.set(tokens.accessToken);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    }
  }

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/login`, payload)
      .pipe(tap((tokens) => this.setSession(tokens)));
  }

  signup(payload: SignupPayload): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/signup`, payload)
      .pipe(tap((tokens) => this.setSession(tokens)));
  }

  fetchCurrentUser(): Observable<User> {
    return this.http
      .get<UserResponse>(`${environment.apiBaseUrl}/users/me`)
      .pipe(
        map((response) => this.resolveUser(response)),
        tap((user) => this.user.set(user)),
      );
  }

  updateProfile(payload: UpdateUserPayload): Observable<User> {
    return this.http
      .patch<UserResponse>(`${environment.apiBaseUrl}/users/me`, payload)
      .pipe(
        map((response) => this.resolveUser(response)),
        tap((user) => this.user.set(user)),
      );
  }

  uploadAvatar(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .patch<UserResponse>(`${environment.apiBaseUrl}/users/me/avatar`, formData)
      .pipe(
        map((response) => this.resolveUser(response)),
        tap((user) => this.user.set(user)),
      );
  }

  // No body needed — the refresh token rides along as an httpOnly cookie
  // (see authInterceptor, which sets withCredentials on every request).
  refreshAccessToken(): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {})
      .pipe(tap((tokens) => this.setSession(tokens)));
  }

  storeTokens(tokens: AuthTokens): void {
    this.setSession(tokens);
  }

  getAccessToken(): string | null {
    const token = this.accessToken();
    if (token) return token;
    
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  clearTokens(): void {
    this.accessToken.set(null);
    this.user.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }

  // Clears the local access token immediately, and asks the backend to
  // clear the httpOnly refresh cookie so it can't silently re-auth later.
  logout(): void {
    const clear = () => this.clearTokens();
    this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).subscribe({
      next: clear,
      error: clear,
    });
  }

  private resolveUser(response: UserResponse): User {
    if ('user' in response) {
      return response.user;
    }

    return response;
  }
}
