import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip all auth endpoints
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authService.getToken();

  // Check token expiry before sending the request
  if (token) {
    try {
      const payload: any = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        // Token expired — log out with a clear message
        authService.logoutWithMessage('Votre session a expiré. Veuillez vous reconnecter.');
        return throwError(() => new Error('Token expired'));
      }
    } catch {
      // Invalid token — log out silently
      authService.logout();
      return throwError(() => new Error('Invalid token'));
    }
  }

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logoutWithMessage('Votre session a expiré. Veuillez vous reconnecter.');
      }
      return throwError(() => error);
    })
  );
};
