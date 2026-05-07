import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};

