import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // The refresh token lives in an httpOnly cookie — every request needs
  // withCredentials so the browser actually sends/receives it cross-origin.
  const credReq = req.clone({ withCredentials: true });

  if (
    credReq.url.includes('/auth/refresh') ||
    credReq.url.includes('/auth/login') ||
    credReq.url.includes('/auth/signup')
  ) {
    return next(credReq);
  }

  const accessToken = authService.getAccessToken();

  const authReq = accessToken
    ? credReq.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : credReq;

  return next(authReq).pipe(
    catchError((error) => {
      // Handle 401 - try to refresh token via the httpOnly cookie
      if (error.status === 401) {
        return authService.refreshAccessToken().pipe(
          switchMap((tokens) => {
            // Retry original request with new token
            const retryReq = authReq.clone({
              setHeaders: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            });

            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Refresh failed, clear tokens and redirect to login
            authService.clearTokens();
            void router.navigate(['/login']);
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
