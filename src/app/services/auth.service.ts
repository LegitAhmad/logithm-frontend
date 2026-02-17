import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  login(payload: LoginPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/login`, payload);
  }

  signup(payload: SignupPayload): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/signup`, payload);
  }

  refreshAccessToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {
      refreshToken,
    });
  }

  storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  logout(): void {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
