import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Uniquement 401 = vrai problème de session
        notificationService.error('Votre session a expiré, veuillez vous reconnecter');
        authService.logout();
        setTimeout(() => router.navigate(['/login']), 3000);
      } else if (error.status === 403) {
        // 403 = authentifié mais pas autorisé -> on affiche le message du backend
        const message = error.error?.message || 'Vous n\'êtes pas autorisé à effectuer cette action';
        notificationService.error(message);
        // Pas de logout, pas de redirection
      }
      return throwError(() => error);
    })
  );
};
