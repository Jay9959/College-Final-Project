import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent implements OnInit {
  otp: string = '';
  email: string = '';
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
      if (!this.email) {
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  onSubmit() {
    if (!this.otp || !this.email) return;

    this.loading = true;

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (res) => {
        this.loading = false;
        this.toastService.success('OTP Verified! Redirecting...');
        setTimeout(() => {
          this.router.navigate(['/reset-password'], {
            queryParams: { email: this.email, otp: this.otp }
          });
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.message || 'Invalid OTP. Please try again.';
        this.toastService.error(errorMessage);
      }
    });
  }
}
