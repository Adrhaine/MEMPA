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
      if (error.status === 401 || error.status === 403) {
        notificationService.error('Votre session a expiré, veuillez vous reconnecter');
        authService.logout();
        // Petit délai pour que la notification s'affiche avant la redirection
        setTimeout(() => router.navigate(['/login']), 3000);
      }
      return throwError(() => error);
    })
  );
};
