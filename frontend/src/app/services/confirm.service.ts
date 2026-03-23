import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmPayload {
  message: string;
  action: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {

  private state = new BehaviorSubject<ConfirmPayload | null>(null);
  // Observable public pour que le composant puisse s'abonner
  state$ = this.state.asObservable();

  // Ouvre la modale avec le message et l'action à exécuter si l'utilisateur confirme
  ask(message: string, action: () => void): void {
    this.state.next({ message, action });
  }

  // Exécute l'action puis ferme
  confirm(): void {
    this.state.getValue()?.action();
    this.close();
  }

  close(): void {
    this.state.next(null);
  }
}
