import { DOCUMENT } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const document = inject(DOCUMENT);
  const origin = document.location?.origin || 'http://localhost';
  const api = new URL(environment.apiBaseUrl, origin);
  const target = new URL(req.url, origin);
  const apiPath = api.pathname.replace(/\/$/, '');
  if (target.origin !== api.origin || (target.pathname !== apiPath && !target.pathname.startsWith(`${apiPath}/`))) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const credentials = req.clone({ withCredentials: true });
  const authPath = target.pathname.slice(apiPath.length);
  if (['/auth/refresh', '/auth/login', '/auth/signup', '/auth/logout'].includes(authPath)) return next(credentials);

  const accessToken = auth.getAccessToken();
  const authenticated = accessToken ? credentials.clone({setHeaders:{Authorization:`Bearer ${accessToken}`}}) : credentials;
  return next(authenticated).pipe(catchError(error => {
    if (error.status !== 401) return throwError(() => error);
    const currentToken = auth.getAccessToken();
    if (currentToken && currentToken !== accessToken) {
      return next(credentials.clone({setHeaders:{Authorization:`Bearer ${currentToken}`}}));
    }
    return auth.refreshAccessToken().pipe(
      catchError(refreshError => {
        auth.clearTokens();
        void router.navigate(['/login']);
        return throwError(() => refreshError);
      }),
      switchMap(tokens => next(credentials.clone({setHeaders:{Authorization:`Bearer ${tokens.accessToken}`}}))),
    );
  }));
};
