import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  userId = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  terminalId = environment.terminalId;
  appVersion = '1.0.0';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    // If already logged in, redirect to menu
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/menu']);
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.userId.trim()) {
      this.errorMessage.set('Employee ID is required');
      return;
    }

    this.loading.set(true);

    this.authService
      .login({ userId: this.userId.trim(), password: this.password })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success) {
            this.router.navigate(['/menu']);
          } else {
            this.errorMessage.set(res.message || 'Login failed');
          }
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.message || err.message || 'Connection error';
          this.errorMessage.set(msg);
        },
      });
  }

  goToSetup(){
  this.router.navigate(['/startup']);
   // history.back(); // Kembali ke halaman sebelumnya (setup) jika pengguna ingin mengubah konfigurasi koneksi
  }
}
