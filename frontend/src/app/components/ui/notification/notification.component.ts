import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css'
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: Notification | null = null;
  progress: number = 100;

  private subscription!: Subscription;
  private progressInterval: any;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notification$.subscribe(notification => {
      this.notification = notification;
      if (notification) {
        this.startProgress();
      } else {
        this.resetProgress();
      }
      this.cdr.detectChanges();
    });
  }

  private startProgress(): void {
    this.progress = 100;
    setTimeout(() => {
      this.progress = 0;
      this.cdr.detectChanges();
    }, 50);
  }

  private resetProgress(): void {
    clearInterval(this.progressInterval);
    this.progress = 100;
  }

  onDismiss(): void {
    this.notificationService.dismiss();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    clearInterval(this.progressInterval);
  }
}
