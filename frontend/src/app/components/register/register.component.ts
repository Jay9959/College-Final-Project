import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
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
    <div class="login-container">
      <div class="split-screen">
        <!-- Left Side: Visual -->
        <div class="left-panel">
          <div class="panel-content">
            <div class="ai-text-group">
              <div class="icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <h2 class="ai-title">Join the</h2>
              <p class="ai-subtitle">Future of Chat</p>
              <p class="ai-description">Connect with friends and colleagues in a secure, futuristic environment.</p>
            </div>
          </div>
          <div class="overlay"></div>
        </div>

        <!-- Right Side: Register Form -->
        <div class="right-panel">
          <div class="form-wrapper">
            <div class="header-group">
              <h1 class="welcome-title">Create Account</h1>
              <p class="welcome-subtitle">Already a member? <a routerLink="/login" class="link-highlight">Log In</a></p>
            </div>

            <form (ngSubmit)="onRegister()" #registerForm="ngForm" class="login-form">
              
              <!-- Username Input -->
              <div class="input-group">
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  [(ngModel)]="username" 
                  placeholder="Username"
                  required
                  minlength="3"
                  class="form-input"
                  [class.has-value]="username.length > 0"
                >
                <div class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </div>

              <!-- Email Input -->
              <div class="input-group">
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="email" 
                  placeholder="Email Address"
                  required
                  email
                  class="form-input"
                  [class.has-value]="email.length > 0"
                >
                <div class="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
              </div>

              <!-- Password Input -->
              <div class="input-group">
                <div class="password-wrapper">
                  <input 
                    [type]="showPassword ? 'text' : 'password'" 
                    id="password" 
                    name="password" 
                    [(ngModel)]="password" 
                    placeholder="Password"
                    required
                    minlength="6"
                    class="form-input"
                    [class.has-value]="password.length > 0"
                  >
                  <div class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <button type="button" class="toggle-password" (click)="togglePassword()">
                    <!-- Eye Open (Show Password) -->
                    <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <!-- Eye Closed/Slash (Hide Password) -->
                    <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
                      <line x1="2" y1="2" x2="22" y2="22"></line>
                    </svg>
                  </button>
                </div>
              </div>

               <!-- Confirm Password Input -->
               <div class="input-group">
                <input 
                    [type]="showConfirmPassword ? 'text' : 'password'" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    [(ngModel)]="confirmPassword" 
                    placeholder="Confirm Password"
                    required
                    class="form-input"
                    [class.has-value]="confirmPassword.length > 0"
                >
                <div class="input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
              </div>

              <div class="error-msg" *ngIf="confirmPassword && password !== confirmPassword">
                Passwords do not match
              </div>

              <!-- Submit Button -->
              <button type="submit" class="btn-signin" [disabled]="registerForm.invalid || password !== confirmPassword || isLoading">
                <span *ngIf="!isLoading">Create Account</span>
                <span *ngIf="isLoading" class="loader"></span>
              </button>
              
              <div class="divider">
                  <span>Or Register With</span>
              </div>

              <!-- Social Login -->
              <div class="social-login">
                  <button type="button" class="social-btn google" (click)="loginWith('google')">
                      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.489 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.424 44.599 -10.174 45.789 L -6.704 42.319 C -8.804 40.359 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                      <span>Google</span>
                  </button>
                  <button type="button" class="social-btn github" (click)="loginWith('github')">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      <span>GitHub</span>
                  </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      font-family: var(--font-main, 'Inter', sans-serif);
      background: var(--bg-deep, #000);
      color: var(--text-main, #fff);
      overflow: hidden;
    }

    .login-container {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #020617; /* Very dark slate, strictly dark mode */
    }

    .split-screen {
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    /* Left Panel Styles */
    .left-panel {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center; 
      padding: 80px 60px;
      padding-bottom: 120px;
      /* Using slightly different accent for Register or same for consistency */
      background: url('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop') center/cover no-repeat;
      overflow: hidden;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(to bottom, rgba(2, 6, 23, 0.4) 0%, rgba(2, 6, 23, 0.95) 90%);
      z-index: 1;
    }

    .panel-content {
      position: relative;
      z-index: 2;
    }

    .icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32px;
        color: var(--primary, #3b82f6);
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    
    .icon-wrapper svg {
        width: 32px;
        height: 32px;
    }

    .ai-text-group {
      animation: fadeInUp 1s ease-out;
    }

    .ai-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
      line-height: 1.1;
      font-family: var(--font-display);
    }

    .ai-subtitle {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 24px 0;
      line-height: 1.1;
      background: linear-gradient(90deg, #fff, var(--primary, #3b82f6));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-family: var(--font-display);
    }
    
    .ai-description {
        font-size: 1.1rem;
        color: #94a3b8;
        max-width: 350px;
        line-height: 1.6;
    }

    /* Right Panel Styles */
    .right-panel {
      flex: 0 0 550px; /* Fixed width */
      background: rgba(15, 23, 42, 0.95); /* Slate 900 */
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      box-shadow: -20px 0 50px rgba(0,0,0,0.5);
      position: relative;
      z-index: 10;
    }

    .form-wrapper {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }

    .header-group {
      margin-bottom: 32px;
    }

    .welcome-title {
      font-size: 2.25rem;
      font-weight: 700;
      margin: 0 0 8px;
      color: #fff;
      letter-spacing: -0.5px;
    }

    .welcome-subtitle {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.95rem;
      margin: 0;
    }
    
    .link-highlight {
        color: var(--primary, #3b82f6);
        text-decoration: none;
        font-weight: 600;
    }
    
    .link-highlight:hover {
        text-decoration: underline;
    }

    .input-group {
      margin-bottom: 20px;
      position: relative;
    }

    .form-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      padding: 14px 14px 14px 48px;
      color: #fff;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.3s ease;
    }

    .form-input:focus {
      border-color: var(--primary, #3b82f6);
      background: rgba(30, 41, 59, 0.8);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
    
    .form-input::placeholder {
      color: #64748b;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      transition: color 0.3s;
      display: flex;
    }

    .form-input:focus ~ .input-icon {
      color: var(--primary, #3b82f6);
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      transition: color 0.2s;
    }

    .toggle-password:hover {
      color: #fff;
    }
    
    .error-msg {
      color: #ef4444; /* Red-500 */
      font-size: 0.85rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .error-msg::before {
        content: '!';
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border-radius: 50%;
        font-size: 0.75rem;
        font-weight: bold;
    }

    .btn-signin {
      display: block;
      width: 100%;
      padding: 16px;
      background: var(--grad-primary, linear-gradient(135deg, #2563eb, #1d4ed8));
      color: #000;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
      margin-top: 10px;
    }

    .btn-signin:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
    }

    .btn-signin:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .divider {
      margin: 24px 0;
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
      background: rgba(148, 163, 184, 0.2);
      z-index: 1;
    }
    
    .divider span {
      background: transparent;
      padding: 0 16px;
      position: relative;
      z-index: 2;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 500;
      background: #101929; /* Match approx bg */
    }

    .social-login {
      display: flex;
      gap: 16px;
    }

    .social-btn {
      flex: 1;
      height: 50px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(255,255,255,0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: #cbd5e1;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .social-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.2);
      transform: translateY(-1px);
    }
    
    .loader {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(0,0,0,0.2);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .right-panel {
        flex: 0 0 500px;
      }
    }

    @media (max-width: 900px) {
      .left-panel {
        display: none;
      }
      .right-panel {
        flex: 1;
        width: 100%;
        box-shadow: none;
        background: #020617; /* Match container bg on mobile */
      }
      .form-wrapper {
        max-width: 100%;
        padding: 0 20px;
      }
    }
  `]
})
export class RegisterComponent implements OnInit, OnDestroy {
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
    const backendUrl = this.authService.getApiUrl();
    const width = 500;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    window.location.href = `${backendUrl}/auth/${provider}`;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onRegister(): void {
    if (!this.username || !this.email || !this.password) return;
    if (this.password !== this.confirmPassword) return;

    this.isLoading = true;

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.toastService.success('Registration successful. Please login.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
