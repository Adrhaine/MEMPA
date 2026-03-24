import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Ce guard protège les routes qui nécessitent d'être ADMIN.
// Si l'utilisateur n'est pas admin, il est redirigé vers la page d'accueil.
export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router      = inject(Router);

  if (authService.isAdmin()) {
    return true; //admin -> accès autorisé
  }

  // pas admin (ou pas connecté) -> redirige vers l'accueil
  router.navigate(['/']);
  return false;
};
