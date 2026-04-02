import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ManualCashService, ManualCashSummaryResponse } from '../../../core/services/manual-cash.service';
import { SessionService } from '../../../core/services/session.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-manual-cash-in',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual-cash-in.component.html',
  styleUrl: './manual-cash-in.component.css',
})
export class ManualCashInComponent {
  displayAmount = signal('0');
  loading = signal(false);
  drawerLoading = signal(false);
  infoMessage = signal('');
  errorMessage = signal('');
  summary = signal<ManualCashSummaryResponse | null>(null);

  userName = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private manualCashService: ManualCashService,
    private sessionService: SessionService,
  ) {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
    this.loadSummary();
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

  goBack(): void {
    history.back();
  }

  openDrawer(): void {
    this.drawerLoading.set(true);
    this.infoMessage.set('');
    this.errorMessage.set('');

    this.manualCashService.openDrawer({ terminalId: environment.terminalId }).subscribe({
      next: (res) => {
        this.drawerLoading.set(false);
        if (res.success) {
          this.infoMessage.set(res.message || 'Cash drawer opened');
        } else {
          this.errorMessage.set(res.message || 'Failed to open drawer');
        }
      },
      error: (err) => {
        this.drawerLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Network error');
      },
    });
  }

  addManualCashIn(): void {
    const amount = parseFloat(this.displayAmount()) || 0;
    if (amount <= 0) {
      this.errorMessage.set('Amount must be greater than 0');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.infoMessage.set('');
    const sessionResetId = this.sessionService.session()?.resetId || this.sessionService.session()?.shiftId;

    this.manualCashService.addCashIn({
      resetId: this.summary()?.resetId || sessionResetId,
      terminalId: environment.terminalId,
      amount,
    }).subscribe({
      next: (res: ApiResponse<{ resetId: string; addedAmount: number; currentCashBalance: number }>) => {
        this.loading.set(false);
        if (res.success) {
          this.infoMessage.set(`Manual cash in added: Rp ${this.formattedAmount}`);
          this.displayAmount.set('0');
          this.loadSummary();
        } else {
          this.errorMessage.set(res.message || 'Failed to add manual cash in');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Network error');
      },
    });
  }

  private loadSummary(): void {
    this.manualCashService.getSummary(environment.terminalId).subscribe({
      next: (res: ApiResponse<ManualCashSummaryResponse>) => {
        if (res.success && res.data) {
          this.summary.set(res.data);
        }
      },
      error: () => {
        this.errorMessage.set('No active shift found for this terminal');
      },
    });
  }
}
