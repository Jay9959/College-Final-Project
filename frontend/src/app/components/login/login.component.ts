import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-wrapper">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      
      <div class="glass-card animate-fade-up">
        <div class="header">
          <div class="icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h1>Welcome Back</h1>
          <p>Enter your credentials to access your chats.</p>
        </div>

        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <div class="input-group">
            <label>Email or Username</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                name="email"
                [(ngModel)]="email"
                required
                placeholder="Username or Email"
                [class.error]="emailInput.invalid && emailInput.touched"
                #emailInput="ngModel"
              >
            </div>
          </div>

          <div class="input-group">
            <label>Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input 
                type="password" 
                name="password"
                [(ngModel)]="password"
                required
                placeholder="••••••••"
              >
            </div>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-glow" [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Sign In</span>
            <div *ngIf="isLoading" class="spinner-sm"></div>
          </button>
        </form>

        <div class="footer">
          <p>Don't have an account? <a routerLink="/register">Create one</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 20px;
    }

    /* Ambient Background Blobs */
    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: -1;
      opacity: 0.6;
    }
    .blob-1 {
      top: -10%;
      left: -10%;
      width: 500px;
      height: 500px;
      background: rgba(0, 210, 173, 0.3);
      animation: float 8s ease-in-out infinite;
    }
    .blob-2 {
      bottom: -10%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: rgba(127, 0, 255, 0.25);
      animation: float 10s ease-in-out infinite reverse;
    }

    .glass-card {
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 48px;
      border-radius: 24px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .icon-box {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, var(--primary-color), #009b85);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: white;
      box-shadow: 0 10px 25px rgba(0, 210, 173, 0.4);
      transform: rotate(-5deg);
    }

    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      background: linear-gradient(to right, #fff, #94a3b8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p { color: var(--text-secondary); font-size: 15px; }

    .input-group { margin-bottom: 20px; }
    
    label {
      display: block;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
      transition: color 0.3s;
    }

    input {
      width: 100%;
      padding: 14px 16px 14px 48px;
      border-radius: 12px;
      font-size: 15px;
    }

    input:focus + .input-icon, input:focus ~ .input-icon {
      color: var(--primary-color);
    }

    .btn-glow {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      background: var(--primary-gradient);
      color: white;
      font-weight: 600;
      font-size: 16px;
      margin-top: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(0, 210, 173, 0.3);
    }

    .btn-glow:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 210, 173, 0.5);
    }

    .btn-glow:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
    }

    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .footer a {
      color: var(--primary-color);
      font-weight: 600;
    }
    
    .footer a:hover { text-decoration: underline; }

    .spinner-sm {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onLogin(): void {
    if (!this.email || !this.password) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
