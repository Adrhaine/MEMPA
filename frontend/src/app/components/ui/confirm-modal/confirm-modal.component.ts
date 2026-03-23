import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmPayload } from '../../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html'
})
export class ConfirmModalComponent implements OnInit, OnDestroy {

  payload: ConfirmPayload | null = null;
  private subscription!: Subscription;

  constructor(
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.confirmService.state$.subscribe(payload => {
      this.payload = payload;
      this.cdr.detectChanges();
    });
  }

  onConfirm(): void  { this.confirmService.confirm(); }
  onClose(): void    { this.confirmService.close(); }

  ngOnDestroy(): void { this.subscription.unsubscribe(); }
}
