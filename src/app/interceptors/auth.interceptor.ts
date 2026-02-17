import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/auth/login') || req.url.includes('/auth/signup')) {
    return next(req);
  }

  const accessToken = authService.getAccessToken();
  console.log('AuthInterceptor - Access Token:', accessToken);

  // If no token, proceed without auth header
  if (!accessToken) {
    return next(req);
  }

  // Clone request with auth header
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return next(authReq).pipe(
    catchError((error) => {
      // Handle 401 - try to refresh token
      if (error.status === 401) {
        const refreshToken = authService.getRefreshToken();

        if (!refreshToken) {
          authService.clearTokens();
          void router.navigate(['/login']);
          return throwError(() => error);
        }

        // Attempt token refresh
        return authService.refreshAccessToken().pipe(
          switchMap((tokens) => {
            authService.storeTokens(tokens);

            // Retry original request with new token
            const retryReq = req.clone({
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
