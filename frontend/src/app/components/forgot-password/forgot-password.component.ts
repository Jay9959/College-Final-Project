import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <!-- Header -->
        <div class="auth-header">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <h1>Forgot <span class="highlight">Password?</span></h1>
          <p>Enter your email address and we'll send you a code to reset your password</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm">
          <!-- Email Input -->
          <div class="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="email" 
              placeholder="Enter your email"
              required
              email
              #emailInput="ngModel"
            >
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-submit" [disabled]="forgotForm.invalid || loading">
            <span *ngIf="!loading">Send Reset Code</span>
            <span *ngIf="loading" class="loader"></span>
          </button>

          <!-- Back to Login -->
          <div class="auth-footer">
            <a routerLink="/login" class="back-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Login</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    :host {
      display: block;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
    }

    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%);
      padding: 40px 20px;
      position: relative;
      overflow: hidden;
    }

    .auth-container::before {
      content: '';
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent);
      top: -200px;
      right: -200px;
      border-radius: 50%;
      animation: pulse 8s ease-in-out infinite;
    }

    .auth-container::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent);
      bottom: -150px;
      left: -150px;
      border-radius: 50%;
      animation: pulse 8s ease-in-out infinite 4s;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      background: rgba(17, 24, 39, 0.8);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 48px 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      position: relative;
      z-index: 1;
      animation: slideUp 0.5s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .auth-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-radius: 20px;
      margin-bottom: 24px;
    }

    .icon-wrapper svg {
      color: #60a5fa;
    }

    .auth-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #f9fafb;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }

    .auth-header .highlight {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-header p {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
      line-height: 1.6;
    }

    /* Form */
    .form-group {
      margin-bottom: 28px;
    }

    .form-group label {
      display: block;
      color: #d1d5db;
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      background: rgba(31, 41, 55, 0.5);
      border: 2px solid #374151;
      border-radius: 12px;
      padding: 14px 16px;
      color: #f9fafb;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      transition: all 0.3s;
      outline: none;
    }

    .form-group input:focus {
      border-color: #14b8a6;
      background: rgba(31, 41, 55, 0.8);
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
    }

    .form-group input::placeholder {
      color: #6b7280;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border: none;
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
      margin-bottom: 24px;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(59, 130, 246, 0.5);
    }

    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Footer */
    .auth-footer {
      text-align: center;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #9ca3af;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
      padding: 8px 16px;
      border-radius: 8px;
    }

    .back-link:hover {
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.05);
    }

    .back-link svg {
      transition: transform 0.3s;
    }

    .back-link:hover svg {
      transform: translateX(-4px);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .auth-card {
        padding: 36px 28px;
      }

      .auth-header h1 {
        font-size: 28px;
      }

      .icon-wrapper {
        width: 70px;
        height: 70px;
      }

      .icon-wrapper svg {
        width: 40px;
        height: 40px;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  onSubmit() {
    if (!this.email) return;

    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success('OTP sent successfully to your email.');
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email } });
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Something went wrong. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
