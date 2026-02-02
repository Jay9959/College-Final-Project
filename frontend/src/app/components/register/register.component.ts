import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <!-- Toggle Header -->
        <div class="auth-toggle">
          <button class="toggle-btn" routerLink="/login">Sign in</button>
          <button class="toggle-btn active">Sign up</button>
        </div>

        <!-- Header -->
        <div class="auth-header">
          <h1>Create <span class="highlight">Account</span></h1>
          <p>Sign up to get started</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onRegister()" #registerForm="ngForm">
          <!-- Username Input -->
          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              name="username" 
              [(ngModel)]="username" 
              placeholder="Enter your username"
              required
              minlength="3"
              #usernameInput="ngModel"
            >
          </div>

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

          <!-- Password Input -->
          <div class="form-group">
            <label>Password</label>
            <div class="password-wrapper">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                name="password" 
                [(ngModel)]="password" 
                placeholder="Enter your password"
                required
                minlength="6"
              >
              <button type="button" class="eye-btn" (click)="togglePassword()">
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password Input -->
          <div class="form-group">
            <label>Confirm Password</label>
            <div class="password-wrapper">
              <input 
                [type]="showConfirmPassword ? 'text' : 'password'" 
                name="confirmPassword" 
                [(ngModel)]="confirmPassword" 
                placeholder="Confirm your password"
                required
              >
              <button type="button" class="eye-btn" (click)="toggleConfirmPassword()">
                <svg *ngIf="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div class="error-msg" *ngIf="confirmPassword && password !== confirmPassword">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Passwords do not match
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn-submit" [disabled]="registerForm.invalid || password !== confirmPassword || isLoading">
            <span *ngIf="!isLoading">Sign Up</span>
            <span *ngIf="isLoading" class="loader"></span>
          </button>

          <!-- Divider -->
          <div class="divider">
            <span>OR SIGN UP WITH</span>
          </div>

          <!-- Social Login -->
          <div class="social-btns">
            <button type="button" class="social-btn" (click)="loginWith('google')">
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span>Google</span>
            </button>
            <button type="button" class="social-btn" (click)="loginWith('github')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>GitHub</span>
            </button>
          </div>

          <!-- Footer -->
          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login">Sign In</a></p>
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
      background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent);
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
      background: radial-gradient(circle, rgba(236, 72, 153, 0.15), transparent);
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

    /* Toggle */
    .auth-toggle {
      display: flex;
      gap: 16px;
      margin-bottom: 40px;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 16px;
      font-weight: 500;
      padding: 8px 0;
      cursor: pointer;
      position: relative;
      transition: color 0.3s;
    }

    .toggle-btn:hover {
      color: #9ca3af;
    }

    .toggle-btn.active {
      color: #a78bfa;
    }

    .toggle-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
      border-radius: 2px;
    }

    /* Header */
    .auth-header {
      margin-bottom: 32px;
    }

    .auth-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #f9fafb;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .auth-header .highlight {
      background: linear-gradient(135deg, #a78bfa, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-header p {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
    }

    /* Form */
    .form-group {
      margin-bottom: 20px;
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

    .password-wrapper {
      position: relative;
    }

    .eye-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.3s;
    }

    .eye-btn:hover {
      color: #9ca3af;
    }

    /* Error Message */
    .error-msg {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ef4444;
      font-size: 13px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
    }

    /* Submit Button */
    .btn-submit {
      width: 100%;
      background: linear-gradient(90deg, #8b5cf6, #ec4899);
      border: none;
      border-radius: 12px;
      padding: 16px;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
      margin-top: 8px;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(139, 92, 246, 0.5);
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

    /* Divider */
    .divider {
      margin: 28px 0;
      text-align: center;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    .divider span {
      background: rgba(17, 24, 39, 0.9);
      padding: 0 16px;
      color: #6b7280;
      font-size: 12px;
      font-weight: 500;
      position: relative;
      letter-spacing: 0.5px;
    }

    /* Social Buttons */
    .social-btns {
      display: flex;
      gap: 12px;
      margin-bottom: 28px;
    }

    .social-btn {
      flex: 1;
      background: rgba(31, 41, 55, 0.5);
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 14px;
      color: #d1d5db;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: all 0.3s;
    }

    .social-btn:hover {
      background: rgba(31, 41, 55, 0.8);
      border-color: #4b5563;
      transform: translateY(-2px);
    }

    /* Footer */
    .auth-footer {
      text-align: center;
    }

    .auth-footer p {
      color: #9ca3af;
      font-size: 14px;
      margin: 0;
    }

    .auth-footer a {
      color: #a78bfa;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s;
    }

    .auth-footer a:hover {
      color: #8b5cf6;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .auth-card {
        padding: 36px 28px;
      }

      .auth-header h1 {
        font-size: 28px;
      }
    }
  `]
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    window.addEventListener('message', this.handleMessage.bind(this), false);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.handleMessage.bind(this));
  }

  handleMessage(event: MessageEvent): void {
    if (event.origin !== 'http://192.168.43.95:5000' && event.origin !== 'http://127.0.0.1:5000' && event.origin !== 'http://localhost:5000') {
      // return; 
    }

    const { token } = event.data;
    if (token) {
      this.ngZone.run(() => {
        this.handleSocialLoginSuccess(token);
      });
    }
  }

  handleSocialLoginSuccess(token: string): void {
    sessionStorage.setItem('token', token);
    this.authService.getProfile().subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: () => {
        this.toastService.error('Failed to load user profile');
        this.router.navigate(['/chat']);
      }
    });
  }

  loginWith(provider: string): void {
    const backendUrl = 'http://192.168.43.95:5000/api/auth';
    const width = 500;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    window.open(
      `${backendUrl}/${provider}`,
      'Authentication',
      `width=${width},height=${height},top=${top},left=${left}`
    );
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegister(): void {
    if (!this.username || !this.email || !this.password) return;
    if (this.password !== this.confirmPassword) return;

    this.isLoading = true;

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
