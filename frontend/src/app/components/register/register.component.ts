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
    <div class="login-container">
      <!-- Background Image -->
      <div class="bg-image"></div>
      
      <!-- Overlay -->
      <div class="overlay"></div>

      <div class="content-wrapper">
        <!-- Left Side (Empty/Spacer) -->
        <div class="spacer"></div>

        <!-- Right Side (Register Form) -->
        <div class="login-card animate-fade-in">
          
          <!-- Toggle Header -->
          <div class="auth-toggle">
            <span class="inactive" routerLink="/login">Sign in</span>
            <span class="active">Sign up</span>
          </div>

          <div class="header">
            <h2>Create an account to join the journey</h2>
          </div>

          <form (ngSubmit)="onRegister()" #registerForm="ngForm">
            
            <div class="form-group">
              <label>Username</label>
              <input 
                type="text" 
                name="username" 
                [(ngModel)]="username" 
                placeholder="Astronaut123"
                required
                minlength="3"
                [class.error]="usernameInput.invalid && usernameInput.touched"
                #usernameInput="ngModel"
              >
            </div>

            <div class="form-group">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                [(ngModel)]="email" 
                placeholder="name@example.com"
                required
                email
                [class.error]="emailInput.invalid && emailInput.touched"
                #emailInput="ngModel"
              >
            </div>

            <div class="form-group">
              <label>Password</label>
              <div class="password-wrapper">
                <input 
                  type="password" 
                  name="password" 
                  [(ngModel)]="password" 
                  placeholder="••••••••••••"
                  required
                  minlength="6"
                >
              </div>
            </div>

            <div class="form-group">
              <label>Confirm Password</label>
              <div class="password-wrapper">
                <input 
                  type="password" 
                  name="confirmPassword" 
                  [(ngModel)]="confirmPassword" 
                  placeholder="••••••••••••"
                  required
                >
              </div>
            </div>

            <!-- <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div> -->
            <div class="error-msg" *ngIf="confirmPassword && password !== confirmPassword">Passwords do not match</div>

            <button type="submit" class="btn-primary" [disabled]="registerForm.invalid || password !== confirmPassword || isLoading">
              <span *ngIf="!isLoading">Sign Up</span>
              <span *ngIf="isLoading" class="loader"></span>
            </button>

            <div class="footer-links">
              <p>Already have an account? <a routerLink="/login">Sign In</a></p>
            </div>

            <div class="social-login">
              <p>OR</p>
              <div class="social-icons">
                <button type="button" class="social-btn google" (click)="loginWith('google')">
                   <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </button>
                <button type="button" class="social-btn apple" (click)="loginWith('apple')">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05 0-3.08-1.05-1.07-1.07-2.79-1.07-3.83 0-1.05 1.05-2.13 2.03-3.07 1.03-2.18-2.32-3.82-7.85-.29-11.45 2.1-2.14 5.92-1.74 7.6.4 1.07 1.34 3.03 1.34 4.12 0 1.28-1.59 4.31-2.48 6.94-.36.1 2.32-2.18 3.32-2.58 3.92-3.1 4.67-4.43 4.67-4.47 4.74h-.05c-2.3 1.15-4.04 4.09-3.99 7 .1 5.37 5.76 7.42 5.95 7.49-.03.11-1.05 3.39-3.23 5.58z M13 6.95C12.16 3.99 15.65 1.58 17.5 1c.52 3.8-3.32 6.74-4.5 5.95z"/></svg>
                </button>
                <button type="button" class="social-btn github" (click)="loginWith('github')">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@300;500;700&display=swap');

    :host {
      display: block;
      height: 100vh;
      font-family: 'Rajdhani', sans-serif;
    }

    .login-container {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }

    /* Background with fallback */
    .bg-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'); /* Placeholder Space Image */
      background-size: cover;
      background-position: center;
      z-index: 1;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.95) 100%);
      z-index: 2;
    }

    .content-wrapper {
      position: relative;
      z-index: 3;
      display: flex;
      height: 100%;
      padding: 40px;
      overflow-y: auto; /* Allow scrolling for small screens/tall content */
    }

    .spacer {
      flex: 1;
      display: none; /* Hidden on mobile */
    }

    @media (min-width: 768px) {
      .spacer { display: block; }
    }

    /* Glassmorphism Card */
    .login-card {
      width: 100%;
      max-width: 450px;
      padding: 3rem 2.5rem;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: auto 0;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Toggle Header */
    .auth-toggle {
      display: flex;
      gap: 20px;
      margin-bottom: 25px;
      font-family: 'Orbitron', 'Rajdhani', sans-serif;
      font-size: 20px;
      font-weight: 700;
    }

    .auth-toggle span {
      cursor: pointer;
      position: relative;
      color: rgba(255,255,255,0.4);
      transition: color 0.3s;
    }

    .auth-toggle span.active {
      color: #fff;
    }

    .auth-toggle span.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 2px;
      background: #3b82f6; /* Blue accent */
      box-shadow: 0 0 10px #3b82f6;
    }

    .auth-toggle span.inactive:hover {
        color: rgba(255,255,255,0.8);
    }

    /* Header */
    .header h2 {
      font-size: 18px;
      font-weight: 500;
      color: rgba(255,255,255,0.8);
      margin-bottom: 30px;
      line-height: 1.4;
    }

    /* Inputs */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
      margin-bottom: 6px;
    }

    .form-group input {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px 16px;
      color: #fff;
      font-family: inherit;
      font-size: 15px;
      transition: all 0.3s;
    }

    .form-group input:focus {
      outline: none;
      background: rgba(255,255,255,0.1);
      border-color: #3b82f6;
    }

    .password-wrapper {
      position: relative;
    }

    /* Button */
    .btn-primary {
      width: 100%;
      padding: 14px;
      background: #3b82f6;
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      transition: all 0.3s;
      margin-top: 10px;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .error-msg {
        color: #ef4444;
        font-size: 14px;
        margin-bottom: 15px;
        text-align: center;
    }

    /* Footer */
    .footer-links {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: rgba(255,255,255,0.6);
    }

    .footer-links a {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
    }

    .social-login {
      margin-top: 25px;
      text-align: center;
    }

    .social-login p {
      color: rgba(255,255,255,0.4);
      font-size: 12px;
      margin-bottom: 15px;
      position: relative;
    }

    .social-icons {
      display: flex;
      justify-content: center;
      gap: 15px;
    }

    .social-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .social-btn:hover {
      background: rgba(255,255,255,0.1);
    }

    .loader {
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
    // Security check (ideally prompt env var)
    if (event.origin !== 'http://localhost:5000' && event.origin !== 'http://127.0.0.1:5000') {
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
    const backendUrl = 'http://localhost:5000/api/auth';
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
        this.toastService.error(this.errorMessage);
      }
    });
  }
}
