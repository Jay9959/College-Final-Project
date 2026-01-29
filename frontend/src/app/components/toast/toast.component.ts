import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" 
           class="toast" 
           [ngClass]="toast.type"
           @toastAnimation>
        <div class="icon">
          <span *ngIf="toast.type === 'success'">✓</span>
          <span *ngIf="toast.type === 'error'">✕</span>
          <span *ngIf="toast.type === 'info'">ℹ</span>
        </div>
        <div class="message">{{ toast.message }}</div>
        <button class="close-btn" (click)="remove(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 16px;
      pointer-events: none;
    }

    .toast {
      position: relative;
      background: rgba(10, 10, 20, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: white;
      padding: 16px 20px;
      border-radius: 16px;
      min-width: 340px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.1), 
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        0 20px 25px -5px rgba(0, 0, 0, 0.5); /* Deep shadow */
      pointer-events: auto;
      font-family: 'Outfit', sans-serif;
      overflow: hidden;
    }

    /* Gradient Border Effect */
    .toast::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: inherit;
    }

    .toast.success::before { background: linear-gradient(to bottom, #10b981, #059669); }
    .toast.error::before { background: linear-gradient(to bottom, #ef4444, #b91c1c); }
    .toast.info::before { background: linear-gradient(to bottom, #3b82f6, #2563eb); }

    /* Subtle Glow */
    .toast.success { box-shadow: 0 0 20px rgba(16, 185, 129, 0.15); }
    .toast.error { box-shadow: 0 0 20px rgba(239, 68, 68, 0.15); }
    .toast.info { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }

    .icon {
      width: 32px;
      height: 32px;
      border-radius: 10px; /* Soft square */
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.05); /* Fallback */
    }

    .toast.success .icon { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1)); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
    .toast.error .icon { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
    .toast.info .icon { background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1)); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }

    .message {
      flex: 1;
      font-size: 15px;
      font-weight: 500;
      letter-spacing: 0.3px;
      line-height: 1.5;
      color: #f1f5f9;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      font-size: 20px;
      padding: 4px;
      line-height: 1;
      border-radius: 6px;
      transition: all 0.2s;
    }
    
    .close-btn:hover { 
      color: white; 
      background: rgba(255, 255, 255, 0.1);
    }
  `],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  remove(id: number): void {
    this.toastService.remove(id);
  }
}
