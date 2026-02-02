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
      <!-- Animated Particles -->
      <div class="particles">
        <div class="particle" *ngFor="let i of particles" 
             [style.left.%]="i.x" 
             [style.top.%]="i.y"
             [style.animation-delay.s]="i.delay">
        </div>
      </div>

      <!-- Floating Shapes -->
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>

      <div class="auth-card">
        <!-- Toggle Header -->
        <div class="auth-toggle fade-in-up" style="animation-delay: 0.1s">
          <button class="toggle-btn active">Sign in</button>
          <button class="toggle-btn" routerLink="/register">Sign up</button>
        </div>

        <!-- Header -->
        <div class="auth-header fade-in-up" style="animation-delay: 0.2s">
          <h1>Welcome <span class="highlight">Back</span></h1>
          <p>Please login to your account</p>
        </div>

        <!-- Form -->
        <form (ngSubmit)="onLogin()" #loginForm="ngForm">
          <!-- Email Input -->
          <div class="form-group fade-in-up" style="animation-delay: 0.3s">
            <label [class.active]="email || emailFocused">Email Address</label>
            <input 
              type="email" 
              name="email" 
              [(ngModel)]="email" 
              (focus)="emailFocused = true"
              (blur)="emailFocused = false"
              placeholder="Enter your email"
              required
              #emailInput="ngModel"
            >
            <div class="input-line"></div>
          </div>

          <!-- Password Input -->
          <div class="form-group fade-in-up" style="animation-delay: 0.4s">
            <label [class.active]="password || passwordFocused">Password</label>
            <div class="password-wrapper">
              <input 
                [type]="showPassword ? 'text' : 'password'" 
                name="password" 
                [(ngModel)]="password" 
                (focus)="passwordFocused = true"
                (blur)="passwordFocused = false"
                placeholder="Enter your password"
                required
              >
              <button type="button" class="eye-btn" (click)="togglePassword()">
                <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
            <div class="input-line"></div>
          </div>

          <!-- Remember & Forgot -->
          <div class="form-options fade-in-up" style="animation-delay: 0.5s">
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
          <button type="submit" class="btn-submit fade-in-up" [disabled]="loginForm.invalid || isLoading" style="animation-delay: 0.6s">
            <span *ngIf="!isLoading" class="btn-content">
              <span>Login</span>
              <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
            <span *ngIf="isLoading" class="loader"></span>
            <span class="btn-ripple"></span>
          </button>

          <!-- Divider -->
          <div class="divider fade-in-up" style="animation-delay: 0.7s">
            <span>OR CONTINUE WITH</span>
          </div>

          <!-- Social Login -->
          <div class="social-btns fade-in-up" style="animation-delay: 0.8s">
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
          <div class="auth-footer fade-in-up" style="animation-delay: 0.9s">
            <p>Don't have an account? <a routerLink="/register">Sign Up</a></p>
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

    /* Animated Particles */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 3px;
      height: 3px;
      background: rgba(59, 130, 246, 0.6);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
      animation: particleFloat 15s ease-in-out infinite;
    }

    @keyframes particleFloat {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.3;
      }
      25% {
        transform: translate(30px, -40px) scale(1.2);
        opacity: 0.7;
      }
      50% {
        transform: translate(-20px, 30px) scale(0.8);
        opacity: 0.5;
      }
      75% {
        transform: translate(40px, 15px) scale(1.1);
        opacity: 0.6;
      }
    }

    /* Floating Shapes */
    .floating-shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.05;
      animation: float 20s ease-in-out infinite;
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      top: 10%;
      left: 5%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      bottom: 15%;
      right: 10%;
      animation-delay: 5s;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      background: linear-gradient(135deg, #14b8a6, #3b82f6);
      top: 50%;
      right: 5%;
      animation-delay: 10s;
    }

    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) rotate(0deg);
      }
      33% {
        transform: translate(30px, -30px) rotate(120deg);
      }
      66% {
        transform: translate(-20px, 20px) rotate(240deg);
      }
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
      animation: cardSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes cardSlideUp {
      from { 
        opacity: 0; 
        transform: translateY(40px) scale(0.95); 
      }
      to { 
        opacity: 1; 
        transform: translateY(0) scale(1); 
      }
    }

    /* Staggered Fade In Animation */
    .fade-in-up {
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      color: #60a5fa;
    }

    .toggle-btn.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
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
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
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
      margin-bottom: 28px;
      position: relative;
    }

    .form-group label {
      position: absolute;
      left: 16px;
      top: 16px;
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      background: linear-gradient(to bottom, transparent 50%, rgba(17, 24, 39, 0.9) 50%);
      padding: 0 4px;
    }

    .form-group label.active {
      top: -8px;
      font-size: 12px;
      color: #14b8a6;
      font-weight: 600;
    }

    .form-group input {
      width: 100%;
      background: rgba(31, 41, 55, 0.5);
      border: 2px solid #374151;
      border-radius: 12px;
      padding: 16px;
      color: #f9fafb;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      outline: none;
    }

    .form-group input:focus {
      border-color: #14b8a6;
      background: rgba(31, 41, 55, 0.8);
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1), 0 0 20px rgba(20, 184, 166, 0.2);
      transform: translateY(-2px);
    }

    .form-group input::placeholder {
      color: transparent;
    }

    .form-group input:focus::placeholder {
      color: #6b7280;
      transition: color 0.3s 0.1s;
    }

    /* Animated Input Line */
    .input-line {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #14b8a6, #3b82f6);
      border-radius: 2px;
      transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(20, 184, 166, 0.5);
    }

    .form-group input:focus ~ .input-line {
      width: 100%;
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
      transition: all 0.3s;
      z-index: 2;
    }

    .eye-btn:hover {
      color: #14b8a6;
      transform: translateY(-50%) scale(1.1);
    }

    .eye-btn:active {
      transform: translateY(-50%) scale(0.95);
    }

    /* Form Options */
    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      font-size: 13px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #9ca3af;
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      width: 0;
      height: 0;
    }

    .custom-checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid #374151;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(31, 41, 55, 0.5);
    }

    .custom-checkbox svg {
      width: 12px;
      height: 12px;
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .checkbox-label input[type="checkbox"]:checked ~ .custom-checkbox {
      background: linear-gradient(135deg, #14b8a6, #3b82f6);
      border-color: #14b8a6;
      transform: rotate(8deg) scale(1.05);
    }

    .checkbox-label input[type="checkbox"]:checked ~ .custom-checkbox svg {
      opacity: 1;
      transform: scale(1);
    }

    .checkbox-label:hover .custom-checkbox {
      border-color: #4b5563;
      transform: scale(1.05);
    }

    .forgot-link {
      color: #9ca3af;
      text-decoration: none;
      transition: all 0.3s;
      position: relative;
    }

    .forgot-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 1px;
      background: #14b8a6;
      transition: width 0.3s;
    }

    .forgot-link:hover {
      color: #14b8a6;
    }

    .forgot-link:hover::after {
      width: 100%;
    }

    /* Submit Button with Animations */
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
      position: relative;
      overflow: hidden;
    }

    .btn-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: gap 0.3s;
    }

    .arrow-icon {
      opacity: 0.7;
      transform: translateX(-5px);
      transition: all 0.3s;
    }

    .btn-submit:hover:not(:disabled) .arrow-icon {
      opacity: 1;
      transform: translateX(0);
    }

    .btn-submit:hover:not(:disabled) .btn-content {
      gap: 12px;
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

    /* Button Ripple Effect */
    .btn-ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .btn-submit:active:not(:disabled) .btn-ripple {
      animation: ripple 0.6s ease-out;
    }

    @keyframes ripple {
      0% {
        width: 0;
        height: 0;
        opacity: 1;
      }
      100% {
        width: 300px;
        height: 300px;
        opacity: 0;
      }
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .social-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }

    .social-btn:hover::before {
      left: 100%;
    }

    .social-btn:hover {
      background: rgba(31, 41, 55, 0.8);
      border-color: #4b5563;
      transform: translateY(-3px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }

    .social-btn:active {
      transform: translateY(-1px);
    }

    .social-btn svg {
      transition: transform 0.3s;
    }

    .social-btn:hover svg {
      transform: scale(1.1) rotate(5deg);
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
      color: #60a5fa;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
      position: relative;
    }

    .auth-footer a::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      transition: width 0.3s;
    }

    .auth-footer a:hover {
      color: #3b82f6;
    }

    .auth-footer a:hover::after {
      width: 100%;
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
