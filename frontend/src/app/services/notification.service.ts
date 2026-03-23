import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  // File d'attente des notifications
  private queue: Notification[] = [];

  // NotificationComponent actuellement affichée (null = rien affiché)
  private currentNotification = new BehaviorSubject<Notification | null>(null);
  notification$ = this.currentNotification.asObservable();

  // Indique si une notification est en cours d'affichage
  private isDisplaying = false;

  success(message: string): void {
    this.queue.push({ message, type: 'success' });
    this.processQueue();
  }

  error(message: string): void {
    this.queue.push({ message, type: 'error' });
    this.processQueue();
  }

  warning(message: string): void {
    this.queue.push({ message, type: 'warning' });
    this.processQueue();
  }

  dismiss(): void {
    this.currentNotification.next(null);
    this.isDisplaying = false;
    // Petite pause entre deux notifications
    setTimeout(() => this.processQueue(), 300);
  }

  // Traite la file d'attente
  private processQueue(): void {
    // Si déjà en train d'afficher ou file vide → on attend
    if (this.isDisplaying || this.queue.length === 0) return;

    this.isDisplaying = true;
    const next = this.queue.shift()!; // retire le premier élément de la file
    this.currentNotification.next(next);

    // Disparition automatique après 3 secondes
    setTimeout(() => this.dismiss(), 3000);
  }
}
