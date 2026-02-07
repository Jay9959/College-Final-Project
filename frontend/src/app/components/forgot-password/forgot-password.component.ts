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
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="auth-card glass-panel">
        <a routerLink="/login" class="back-link-top">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Login
        </a>

        <!-- Step 1: Email -->
        <div *ngIf="step === 'email'" class="animate-fade-in">
          <div class="auth-header">
            <div class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Forgot <br><span class="text-gradient">Password?</span></h2>
            <p>Enter your registered email address to receive a 6-digit verification code.</p>
          </div>

          <form (ngSubmit)="onSendOtp()" #emailForm="ngForm">
            <div class="floating-input-group">
              <input type="email" id="email" name="email" [(ngModel)]="email" required email placeholder=" ">
              <label for="email">Email Address</label>
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="emailForm.invalid || loading">
              <span *ngIf="!loading">Send Verification Code</span>
              <span *ngIf="loading" class="loader"></span>
            </button>
          </form>
        </div>

        <!-- Step 2: OTP -->
        <div *ngIf="step === 'otp'" class="animate-fade-in">
          <div class="auth-header">
            <div class="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h2>Verify <br><span class="text-gradient">OTP</span></h2>
            <p>We've sent a code to <b>{{email}}</b>. Please enter it below to continue.</p>
          </div>

          <form (ngSubmit)="onVerifyOtp()" #otpForm="ngForm">
            <div class="floating-input-group">
              <input type="text" id="otp" name="otp" [(ngModel)]="otp" required minlength="6" maxlength="6" pattern="[0-9]*" placeholder=" ">
              <label for="otp">Enter 6-digit OTP</label>
              <div class="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="otpForm.invalid || loading">
              <span *ngIf="!loading">Verify OTP</span>
              <span *ngIf="loading" class="loader"></span>
            </button>
            <p class="resend-text">Didn't receive code? <a (click)="onSendOtp()" [class.disabled]="loading">Resend</a></p>
          </form>
        </div>

        <!-- Step 3: Reset Password -->
        <div *ngIf="step === 'reset'" class="animate-fade-in">
          <div class="auth-header">
            <div class="icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3y"/>
              </svg>
            </div>
            <h2>Reset <br><span class="text-gradient">Password</span></h2>
            <p>Create a strong new password for your account.</p>
          </div>

          <form (ngSubmit)="onResetPassword()" #resetForm="ngForm">
            <div class="floating-input-group">
              <input type="password" id="password" name="password" [(ngModel)]="password" required minlength="6" placeholder=" ">
              <label for="password">New Password</label>
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>

            <div class="floating-input-group">
              <input type="password" id="confirmPassword" name="confirmPassword" [(ngModel)]="confirmPassword" required placeholder=" ">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="resetForm.invalid || loading">
              <span *ngIf="!loading">Reset Password</span>
              <span *ngIf="loading" class="loader"></span>
            </button>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; background: #0f172a; }
    .auth-container { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
    .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.6; z-index: 0; animation: float 10s ease-in-out infinite; }
    .orb-1 { width: 400px; height: 400px; background: #00f2fe; top: -100px; left: -100px; }
    .orb-2 { width: 300px; height: 300px; background: #4facfe; bottom: -50px; right: -50px; animation-delay: 2s; }
    .auth-card { width: 100%; max-width: 480px; padding: 50px 40px; position: relative; background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; z-index: 10; }
    .back-link-top { position: absolute; top: 24px; left: 24px; display: flex; align-items: center; gap: 6px; color: #94a3b8; text-decoration: none; font-size: 0.9rem; transition: color 0.2s; cursor: pointer; }
    .back-link-top:hover { color: #fff; }
    .auth-header { text-align: center; margin-bottom: 40px; }
    .icon-wrapper { width: 70px; height: 70px; border-radius: 20px; background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.2); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #00f2fe; }
    .text-gradient { background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: 2.2rem; margin-bottom: 10px; color: #fff; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
    .floating-input-group { position: relative; margin-bottom: 25px; }
    .floating-input-group input { width: 100%; background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px 16px 16px 45px; color: #fff; font-size: 1rem; outline: none; transition: all 0.3s; }
    .floating-input-group label { position: absolute; left: 45px; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; transition: all 0.3s; }
    .floating-input-group input:focus, .floating-input-group input:not(:placeholder-shown) { border-color: #00f2fe; background: rgba(15, 23, 42, 0.8); }
    .floating-input-group input:focus + label, .floating-input-group input:not(:placeholder-shown) + label { top: 0; left: 14px; font-size: 0.75rem; color: #00f2fe; background: #1e293b; padding: 0 5px; }
    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; transition: color 0.3s; }
    .floating-input-group input:focus ~ .input-icon { color: #00f2fe; }
    .btn-primary { width: 100%; padding: 16px; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); border: none; border-radius: 12px; color: #000; font-weight: 700; cursor: pointer; transition: all 0.3s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 20px rgba(0, 242, 254, 0.4); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .resend-text { text-align: center; margin-top: 20px; }
    .resend-text a { color: #00f2fe; text-decoration: none; cursor: pointer; font-weight: 500; }
    .resend-text a.disabled { opacity: 0.5; cursor: not-allowed; }
    .loader { display: inline-block; width: 22px; height: 22px; border: 3px solid rgba(0,0,0,0.1); border-top-color: #000; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ForgotPasswordComponent {
  step: 'email' | 'otp' | 'reset' = 'email';
  email: string = '';
  otp: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  onSendOtp() {
    if (!this.email) return;
    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 'otp';

        if (res && res.otp) {
          // If backend returned OTP (due to email failure), show it clearly to the user
          // Use ALERT so it doesn't disappear and user can read it easily
          alert(`[EMAIL BLOCKED BY SERVER]\n\nYour Verification Code is: ${res.otp}\n\nPlease enter this code to reset your password.`);
          console.log('OTP Code:', res.otp);
        } else {
          this.toastService.success('Verification code sent to your email.');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Failed to send OTP. Please try again.');
      }
    });
  }

  onVerifyOtp() {
    if (this.otp.length !== 6) return;
    this.loading = true;
    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: () => {
        this.loading = false;
        this.step = 'reset';
        this.toastService.success('OTP verified successfully!');
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Invalid OTP code.');
      }
    });
  }

  onResetPassword() {
    if (this.password !== this.confirmPassword) {
      this.toastService.error('Passwords do not match');
      return;
    }
    if (this.password.length < 6) {
      this.toastService.error('Password must be at least 6 characters');
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.email, this.otp, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.error?.message || 'Failed to reset password.');
      }
    });
  }
}
