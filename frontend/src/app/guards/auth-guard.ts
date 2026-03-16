import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Ce guard protège les routes qui nécessitent d'être connecté
export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // ✅ connecté → accès autorisé
  }

  // ❌ pas connecté → redirige vers login
  router.navigate(['/login']);
  return false;
};
