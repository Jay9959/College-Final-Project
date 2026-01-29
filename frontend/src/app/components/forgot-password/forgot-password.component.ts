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
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) { }

  onSubmit() {
    if (!this.email) return;

    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success('OTP sent successfully to your email.');
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], { queryParams: { email: this.email } });
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Something went wrong. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
