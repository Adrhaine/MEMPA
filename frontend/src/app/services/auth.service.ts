import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Inscription
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, email, password });
  }

  // Connexion — on stocke le token et l'utilisateur dans le localStorage
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // On sauvegarde le token pour les futures requêtes
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // PATCH — modifier le pseudo
  updateUsername(username: string): Observable<{ user: any }> {
    return this.http.patch<{ user: any }>(`${this.apiUrl}/profile`, { username }).pipe(
      tap(response => {
        // Met à jour le localStorage avec le nouveau pseudo
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  // Déconnexion — on supprime les données du localStorage
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Vérifie si l'utilisateur est connecté ET que son token n'est pas expiré
  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      // Un token JWT est composé de 3 parties séparées par des points
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp est en secondes, Date.now() est en millisecondes donc on multiplie par 1000
      return payload.exp * 1000 > Date.now();
    } catch {
      // Si le token est malformé, on considère l'utilisateur déconnecté
      return false;
    }
  }

  isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // On vérifie à la fois que le token est valide ET que le rôle est admin
      return payload.exp * 1000 > Date.now() && payload.role === 'admin';
    } catch {
      return false;
    }
  }

  // Récupère le token pour l'envoyer dans les requêtes protégées
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Récupère l'utilisateur connecté
  getCurrentUser(): any | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
