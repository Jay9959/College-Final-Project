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
      <!-- Animated Background Elements -->
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="auth-card glass-panel">
        <!-- Back Button -->
        <a routerLink="/login" class="back-link-top">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </a>

        <!-- Header -->
        <div class="auth-header">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Forgot <br><span class="text-gradient">Password?</span></h2>
          <p>Don't worry! It happens. Please enter the email address associated with your account.</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" #forgotForm="ngForm">
          <!-- Email Input -->
          <div class="floating-input-group">
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email" 
              required 
              email
              placeholder=" "
            >
            <label for="email">Email Address</label>
            <div class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-primary" [disabled]="forgotForm.invalid || loading">
            <span *ngIf="!loading">Send Reset Code</span>
            <span *ngIf="loading" class="loader"></span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
    
    .auth-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
    }

    /* Glow Orbs */
    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.6;
      z-index: 0;
      animation: float 10s ease-in-out infinite;
    }
    
    .orb-1 {
      width: 400px;
      height: 400px;
      background: var(--primary-dark);
      top: -100px;
      left: -100px;
    }
    
    .orb-2 {
      width: 300px;
      height: 300px;
      background: var(--accent-dark);
      bottom: -50px;
      right: -50px;
      animation-delay: 2s;
    }

    /* Card */
    .auth-card {
      width: 100%;
      max-width: 480px;
      padding: 50px 40px;
      position: relative;
      background: rgba(15, 23, 42, 0.6);
      z-index: 10;
    }

    .back-link-top {
      position: absolute;
      top: 24px;
      left: 24px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    
    .back-link-top:hover {
      color: var(--text-main);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 40px;
      margin-top: 10px;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: var(--primary);
      box-shadow: var(--shadow-sm);
    }
    
    .icon-wrapper svg {
      width: 40px;
      height: 40px;
    }

    .auth-header h2 {
      font-size: 2.5rem;
      line-height: 1.1;
      font-weight: 700;
      margin-bottom: 12px;
      font-family: var(--font-display);
    }

    .auth-header p {
      color: var(--text-secondary);
      font-size: 1rem;
      line-height: 1.6;
    }

    /* Floating Input */
    .floating-input-group {
      position: relative;
      margin-bottom: 32px;
    }

    .floating-input-group input {
      width: 100%;
      background: #1e293b; /* Fallback */
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 16px 16px 45px; /* space for icon */
      font-size: 1rem;
      color: var(--text-main);
      outline: none;
      transition: all 0.3s;
    }

    .floating-input-group label {
      position: absolute;
      left: 45px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      transition: all 0.3s;
      font-size: 0.95rem;
    }

    /* Float label on focus or content */
    .floating-input-group input:focus,
    .floating-input-group input:not(:placeholder-shown) {
      border-color: var(--primary);
      background: rgba(30, 41, 59, 0.8);
      box-shadow: 0 0 0 4px rgba(0, 242, 254, 0.1);
    }

    .floating-input-group input:focus + label,
    .floating-input-group input:not(:placeholder-shown) + label {
      top: 0;
      left: 14px;
      transform: translateY(-50%);
      font-size: 0.75rem;
      background: var(--bg-surface);
      padding: 0 6px;
      color: var(--primary);
      border-radius: 4px;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }

    .floating-input-group input:focus ~ .input-icon {
      color: var(--primary);
    }

    /* Buttons */
    .btn-primary {
      width: 100%;
      padding: 16px;
      background: var(--grad-primary);
      border: none;
      border-radius: 12px;
      color: #000;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-neon);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      filter: grayscale(1);
    }
    
    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0,0,0,0.3);
      border-top-color: black;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
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
