import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <!-- Animated Background Elements -->
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="auth-wrapper glass-panel">
        
        <!-- Left Side: Visual/Welcome -->
        <div class="auth-visual">
          <div class="visual-content">
            <div class="logo-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="app-logo">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h2>Welcome <br><span class="text-gradient">Back!</span></h2>
            <p>Enter your details to access your secure workspace.</p>
          </div>
          <!-- Decorative shapes -->
          <div class="shape-diamond"></div>
          <div class="shape-circle"></div>
        </div>

        <!-- Right Side: Form -->
        <div class="auth-form-side">
          <div class="form-header">
            <h3>Sign In</h3>
            <p>New here? <a routerLink="/register" class="link-animate">Create Account</a></p>
          </div>

          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <!-- Email Input -->
            <div class="floating-input-group">
              <input 
                type="email" 
                id="email" 
                name="email" 
                [(ngModel)]="email" 
                (focus)="emailFocused = true"
                (blur)="emailFocused = false"
                required
                placeholder=" "
              >
              <label for="email">Email Address</label>
              <div class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
            </div>

            <!-- Password Input -->
            <div class="floating-input-group">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                id="password" 
                name="password" 
                [(ngModel)]="password" 
                (focus)="passwordFocused = true"
                (blur)="passwordFocused = false"
                required
                placeholder=" "
              >
              <label for="password">Password</label>
              <button type="button" class="eye-toggle" (click)="togglePassword()">
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>

            <!-- Remember & Forgot -->
            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                <span class="custom-checkbox">
                  <svg viewBox="0 0 12 10" fill="none">
                    <polyline points="1.5 6 4.5 9 10.5 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span>Remember Me</span>
              </label>
              <a routerLink="/forgot-password" class="forgot-link">Forgot Password?</a>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn-primary" [disabled]="loginForm.invalid || isLoading">
              <span *ngIf="!isLoading">Sign In</span>
              <span *ngIf="isLoading" class="loader"></span>
            </button>

            <!-- Divider -->
            <div class="divider">
              <span>Or Continue With</span>
            </div>

            <!-- Social Login -->
            <div class="social-row">
              <button type="button" class="btn-social" (click)="loginWith('google')">
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.704 42.319 C -8.804 40.359 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                Google
              </button>
              <button type="button" class="btn-social" (click)="loginWith('github')">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <span>GitHub</span>
              </button>
            </div>
          </form>
        </div>
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

    /* Wrapper */
    .auth-wrapper {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1000px;
      display: flex;
      min-height: 600px;
      overflow: hidden;
    }

    /* Visual Side (Left) */
    .auth-visual {
      flex: 1;
      background: rgba(0,0,0,0.2);
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .visual-content {
      position: relative;
      z-index: 2;
    }

    .logo-wrapper {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      color: var(--primary);
    }
    
    .logo-wrapper svg {
      width: 32px;
      height: 32px;
    }

    .auth-visual h2 {
      font-size: 3rem;
      line-height: 1.1;
      font-weight: 700;
      margin-bottom: 16px;
      font-family: var(--font-display);
    }

    .auth-visual p {
      color: var(--text-secondary);
      font-size: 1.1rem;
      max-width: 300px;
      line-height: 1.6;
    }

    /* Decorative Shapes */
    .shape-diamond {
      position: absolute;
      width: 200px;
      height: 200px;
      border: 2px solid rgba(255,255,255,0.05);
      transform: rotate(45deg);
      top: 10%;
      right: -50px;
    }

    .shape-circle {
      position: absolute;
      width: 300px;
      height: 300px;
      border: 2px solid rgba(255,255,255,0.03);
      border-radius: 50%;
      bottom: -100px;
      left: 20px;
    }

    /* Form Side (Right) */
    .auth-form-side {
      flex: 1;
      padding: 60px 50px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: rgba(15, 23, 42, 0.4); /* slightly darker */
    }

    .form-header {
      margin-bottom: 40px;
    }

    .form-header h3 {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .form-header p {
      color: var(--text-muted);
    }

    .link-animate {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      position: relative;
    }
    
    .link-animate::after {
      content: '';
      position: absolute;
      width: 0%;
      height: 2px;
      bottom: -2px;
      left: 0;
      background-color: var(--primary);
      transition: width 0.3s;
    }
    
    .link-animate:hover::after {
      width: 100%;
    }

    /* Floating Input */
    .floating-input-group {
      position: relative;
      margin-bottom: 24px;
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

    .eye-toggle {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      transition: color 0.3s;
    }

    .eye-toggle:hover {
      color: var(--text-main);
    }

    /* Form Options (Remember Me / Forgot) */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      font-size: 0.9rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: var(--text-secondary);
      gap: 10px;
      user-select: none;
    }

    .checkbox-label input {
      display: none;
    }

    .custom-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid var(--border-subtle);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      background: rgba(255,255,255,0.05);
    }

    .checkbox-label input:checked + .custom-checkbox {
      background: var(--primary);
      border-color: var(--primary);
    }

    .custom-checkbox svg {
      width: 12px;
      height: 12px;
      stroke-width: 3;
      opacity: 0;
      transform: scale(0.5);
      transition: all 0.2s;
    }

    .checkbox-label input:checked + .custom-checkbox svg {
      opacity: 1;
      transform: scale(1);
    }

    .forgot-link {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    .forgot-link:hover {
      color: var(--text-main);
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

    .divider {
      margin: 30px 0;
      display: flex;
      align-items: center;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-subtle);
    }
    
    .divider span {
      padding: 0 10px;
    }

    .social-row {
      display: flex;
      gap: 16px;
    }

    .btn-social {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      color: var(--text-main);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-social:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-glow);
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

    /* Mobile */
    @media (max-width: 768px) {
      .auth-wrapper {
        flex-direction: column;
        max-width: 450px;
      }
      
      .auth-visual {
        display: none; /* Hide visual on mobile */
      }
      
      .auth-form-side {
        padding: 40px 30px;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isLoading = false;
  emailFocused = false;
  passwordFocused = false;

  // Particles for background animation
  particles = Array.from({ length: 20 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2
  }));

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.handleSocialLoginSuccess(token);
      }
    });
  }

  handleSocialLoginSuccess(token: string): void {
    sessionStorage.setItem('token', token);
    this.authService.getProfile().subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        console.error('Failed to fetch user profile', err);
        this.toastService.error('Failed to load user profile');
        this.router.navigate(['/chat']);
      }
    });
  }

  onLogin(): void {
    if (!this.email || !this.password) return;

    this.isLoading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }

  loginWith(provider: string): void {
    const backendUrl = 'http://192.168.43.95:5000/api/auth';
    window.location.href = `${backendUrl}/${provider}`;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
