import {ChangeDetectorRef, Component} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

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
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

  onLogin(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        // Connexion réussie → redirige vers la page d'accueil
        this.router.navigate(['/']);
      },
      error: (err) => {
        // Affiche le message d'erreur du serveur
        this.errorMessage = err.error.message || 'Erreur de connexion';
        this.cdr.detectChanges();
      }
    });
  }
}
