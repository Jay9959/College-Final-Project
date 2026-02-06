
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-mobile-login',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mobile-login-container">
      <div class="status-card">
        <div *ngIf="loading" class="spinner"></div>
        
        <div *ngIf="loading" class="status-text">
          <h3>Authenticating...</h3>
          <p>Please wait while we log you in.</p>
        </div>

        <div *ngIf="error" class="error-text">
          <div class="icon error-icon">❌</div>
          <h3>Login Failed</h3>
          <p>{{ error }}</p>
          <button (click)="goToLogin()" class="btn">Go to Login</button>
        </div>

        <div *ngIf="success" class="success-text">
          <div class="icon success-icon">✅</div>
          <h3>Success!</h3>
          <p>Redirecting to chat...</p>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .mobile-login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #111b21;
      color: #e9edef;
      font-family: 'Segoe UI', sans-serif;
    }
    .status-card {
      background: #202c33;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 90%;
      width: 350px;
    }
    .spinner {
      margin: 0 auto 20px;
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #00a884;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    h3 { margin: 10px 0; font-weight: 500; }
    p { margin: 0 0 20px; color: #8696a0; font-size: 0.9em; }
    .btn {
      background: #00a884;
      color: #111b21;
      border: none;
      padding: 10px 24px;
      border-radius: 24px;
      font-weight: 600;
      cursor: pointer;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class MobileLoginComponent implements OnInit {
    loading = true;
    error = '';
    success = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const token = params['token'];
            if (token) {
                this.verifyToken(token);
            } else {
                this.loading = false;
                this.error = 'No login token found in link.';
            }
        });
    }

    verifyToken(token: string) {
        this.authService.verifyQrToken(token).subscribe({
            next: (res) => {
                this.loading = false;
                this.success = true;
                setTimeout(() => this.router.navigate(['/chat']), 1500);
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.message || 'Invalid or expired QR code.';
            }
        });
    }

    goToLogin() {
        this.router.navigate(['/login']);
    }
}
