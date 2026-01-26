import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="register-wrapper">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="glass-card animate-fade-up">
        <div class="header">
          <div class="icon-box">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h1>Create Account</h1>
          <p>Join our community today.</p>
        </div>

        <form (ngSubmit)="onRegister()" #registerForm="ngForm">
          <div class="input-group">
            <label>Username</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input 
                type="text" 
                name="username"
                [(ngModel)]="username"
                required
                minlength="3"
                placeholder="Choose a username"
              >
            </div>
          </div>

          <div class="input-group">
            <label>Email Address</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                name="email"
                [(ngModel)]="email"
                required
                email
                placeholder="name@example.com"
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
                minlength="6"
                placeholder="6+ characters"
              >
            </div>
          </div>

          <div class="input-group">
            <label>Confirm Password</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <input 
                type="password" 
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                required
                placeholder="Repeat password"
              >
            </div>
          </div>

          <div class="error-banner" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <div class="error-banner" *ngIf="confirmPassword && password !== confirmPassword">
            Passwords do not match
          </div>

          <button 
            type="submit" 
            class="btn-glow" 
            [disabled]="registerForm.invalid || password !== confirmPassword || isLoading"
          >
            <span *ngIf="!isLoading">Start Chatting</span>
            <div *ngIf="isLoading" class="spinner-sm"></div>
          </button>
        </form>

        <div class="footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 40px 20px;
    }

    .blob {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      z-index: -1;
      opacity: 0.6;
    }
    .blob-1 {
      top: -10%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: rgba(127, 0, 255, 0.25);
      animation: float 10s ease-in-out infinite;
    }
    .blob-2 {
      bottom: -10%;
      left: -10%;
      width: 600px;
      height: 600px;
      background: rgba(0, 210, 173, 0.25);
      animation: float 12s ease-in-out infinite reverse;
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
      margin-bottom: 32px;
    }

    .icon-box {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #7F00FF, #E100FF);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: white;
      box-shadow: 0 10px 25px rgba(127, 0, 255, 0.4);
      transform: rotate(5deg);
    }

    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      background: linear-gradient(to right, #fff, #cbd5e1);
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
      color: #E100FF;
    }

    .btn-glow {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      background: var(--secondary-gradient);
      color: white;
      font-weight: 600;
      font-size: 16px;
      margin-top: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(127, 0, 255, 0.3);
    }

    .btn-glow:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(127, 0, 255, 0.5);
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
      margin-bottom: 20px;
      text-align: center;
    }

    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .footer a {
      color: #E100FF;
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
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onRegister(): void {
    if (!this.username || !this.email || !this.password) return;
    if (this.password !== this.confirmPassword) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
