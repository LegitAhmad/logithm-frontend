import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

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
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  readonly isAuthenticated = signal(!!this.getAccessToken());

  readonly accessToken = signal<string | null>(this.getInitialToken(ACCESS_TOKEN_KEY));
  readonly refreshToken = signal<string | null>(this.getInitialToken(REFRESH_TOKEN_KEY));
  readonly user = signal<User | null>(null); // Populate this on login or "me" endpoint

  constructor() {
    // 3. Sync Signals to LocalStorage automatically
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const token = this.accessToken();
        const refresh = this.refreshToken();

        if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
        else localStorage.removeItem(ACCESS_TOKEN_KEY);

        if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        else localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    });
  }

  private getInitialToken(key: string): string | null {
    return isPlatformBrowser(this.platformId) ? localStorage.getItem(key) : null;
  }

  private setSession(tokens: AuthTokens): void {
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
    // You could also decode the JWT here to set the user signal
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

  refreshAccessToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, {
      refreshToken,
    });
  }

  storeTokens(tokens: AuthTokens): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  clearTokens(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  logout(): void {
    this.clearTokens();
  }
}
