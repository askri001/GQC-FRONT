import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Global HTTP error interceptor.
 *
 * Priority for error message:
 *   1. error.error.message  (backend JSON body)
 *   2. error.error.error    (Spring default field)
 *   3. Fallback per status code
 *
 * Always throws an Error whose `.message` is the final resolved string.
 * Components should read:  err.message
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('[HTTP Error]', error.status, req.url, error.error);

      // Helper: extract backend message if present
      const backendMsg: string | null =
        (typeof error.error === 'object' && error.error !== null)
          ? (error.error.message || error.error.error || null)
          : (typeof error.error === 'string' && error.error.trim() ? error.error.trim() : null);

      let errorMessage: string;

      if (error.error instanceof ErrorEvent) {
        // Client-side / network error
        errorMessage = error.error.message || 'Erreur réseau';

      } else {
        switch (error.status) {

          case 0:
            errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
            break;

          case 400:
          case 409:
            // Always use backend message for business rule violations
            errorMessage = backendMsg || `Requête invalide (${error.status})`;
            break;

          case 401:
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (!router.url.includes('/login') && !req.url.includes('/auth/login')) {
              router.navigate(['/login']);
            }
            break;

          case 403:
            errorMessage = backendMsg || 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
            break;

          case 404:
            errorMessage = backendMsg || 'Ressource non trouvée.';
            break;

          case 500:
            // Use backend message if available, otherwise generic
            errorMessage = backendMsg || 'Erreur serveur. Veuillez réessayer plus tard.';
            break;

          default:
            errorMessage = backendMsg || `Erreur inattendue (${error.status})`;
        }
      }

      // Throw an Error so components read err.message
      return throwError(() => new Error(errorMessage));
    })
  );
};
