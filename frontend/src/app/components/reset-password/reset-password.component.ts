import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  password: string = '';
  confirmPassword: string = '';
  email: string = '';
  otp: string = '';
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email = params['email'];
      this.otp = params['otp'];
      if (!this.email || !this.otp) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  onSubmit() {
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
      next: (res) => {
        this.loading = false;
        this.toastService.success('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
