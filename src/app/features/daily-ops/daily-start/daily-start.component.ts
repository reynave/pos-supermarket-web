import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { environment } from '../../../../environments/environment';


@Component({
  selector: 'app-daily-start',
  standalone: true,
  imports: [HeaderComponent],
  templateUrl: './daily-start.component.html',
  styleUrl: './daily-start.component.css',
})
export class DailyStartComponent {
  displayAmount = signal('0');
  loading = signal(false);
  errorMessage = signal('');

  userName = '';
  shiftId = '';

  private readonly keys = ['1','2','3','4','5','6','7','8','9','.','0','backspace'];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';

    // If shift already active, skip to cart
    if (this.sessionService.isShiftActive()) {
      this.router.navigate(['/cart']);
    }
  }

  get formattedAmount(): string {
    const num = parseFloat(this.displayAmount()) || 0;
    return new Intl.NumberFormat('id-ID', { style: 'decimal', minimumFractionDigits: 0 }).format(num);
  }

  onKey(key: string): void {
    const current = this.displayAmount();
    if (key === 'backspace') {
      this.displayAmount.set(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    if (key === '.' && current.includes('.')) return;
    if (current === '0' && key !== '.') {
      this.displayAmount.set(key);
    } else {
      this.displayAmount.set(current + key);
    }
  }

  openDrawer(): void {
    // For now just visual feedback; could connect to hardware API later
  }

  startShift(): void {
    const openingBalance = parseFloat(this.displayAmount()) || 0;
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.post<any>(`${environment.apiUrl}/shift/open`, { openingBalance, terminalId: environment.terminalId }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const sessionId = res.data.resetId || res.data.settlementId || '';
          this.sessionService.startShift({
            shiftId: sessionId,
            resetId: sessionId,
            settlementId: sessionId,
            openingBalance,
          });
          this.router.navigate(['/home']).then(() => { 
            setTimeout(() => {
              this.router.navigate(['/cart']);
            }, 200);

          });
        } else {
          this.errorMessage.set(res.message || 'Failed to open shift');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Network error');
      },
    });
  }
}
