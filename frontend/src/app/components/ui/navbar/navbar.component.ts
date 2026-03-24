import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  // Paramètres personnalisables selon la page où on place la navbar
  @Input() showBackButton: boolean = false;
  @Input() badgeText: string = '';
  @Input() showSubtitle: boolean = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  // Récupère dynamiquement le pseudo de l'utilisateur connecté
  get username(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.username : '';
  }

  goHome() {
    this.router.navigate(['/']);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
