import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  onLogin(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.notificationService.success('Connexion réussie !');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.notificationService.error(err.error.message || 'Erreur de connexion');
      }
    });
  }
}
