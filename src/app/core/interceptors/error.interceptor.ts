import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            router.navigate(['/login']);
            break;
          case 403:
            errorMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
            break;
          case 404:
            errorMessage = 'Ressource non trouvée.';
            break;
          case 500:
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            break;
          default:
            errorMessage = error.error?.message || `Erreur ${error.status}`;
        }
      }

      console.error('HTTP Error:', error);
      return throwError(() => new Error(errorMessage));
    })
  );
};

