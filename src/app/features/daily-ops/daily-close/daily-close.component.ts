import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

interface ShiftSummary {
  grossSales: number;
  taxCollected: number;
  digitalPayments: number;
  cashExpected: number;
  totalTransactions: number;
  openingBalance: number;
}

interface DenominationRow {
  label: string;
  value: number;
  qty: number;
}

@Component({
  selector: 'app-daily-close',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyIdrPipe],
  templateUrl: './daily-close.component.html',
  styleUrl: './daily-close.component.css',
})
export class DailyCloseComponent {
  loading = signal(false);
  closing = signal(false);
  errorMessage = signal('');

  userName = '';
  userRole = '';

  shiftNotes = '';
  coinsOther = 0;

  denominations: DenominationRow[] = [
    { label: 'Rp 100.000', value: 100000, qty: 0 },
    { label: 'Rp 50.000', value: 50000, qty: 0 },
    { label: 'Rp 20.000', value: 20000, qty: 0 },
    { label: 'Rp 10.000', value: 10000, qty: 0 },
    { label: 'Rp 5.000', value: 5000, qty: 0 },
    { label: 'Rp 2.000', value: 2000, qty: 0 },
    { label: 'Rp 1.000', value: 1000, qty: 0 },
  ];

  summary = signal<ShiftSummary>({
    grossSales: 0,
    taxCollected: 0,
    digitalPayments: 0,
    cashExpected: 0,
    totalTransactions: 0,
    openingBalance: 0,
  });

  physicalCashTotal = computed(() => {
    const denomTotal = this.denominations.reduce((sum, d) => sum + d.value * d.qty, 0);
    return denomTotal + (this.coinsOther || 0);
  });

  discrepancy = computed(() => this.physicalCashTotal() - this.summary().cashExpected);

  activeTab = signal<'eod' | 'history'>('eod');

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? '';
    this.userRole = user?.role ?? '';
    this.loadSummary();
  }

  private loadSummary(): void {
    const session = this.sessionService.session();
    if (!session?.shiftId) return;

    this.loading.set(true);
    this.http.get<ApiResponse<any>>(
      `${environment.apiUrl}/shift/summary/${session.shiftId}`,
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const d = res.data;
          const cashPayments = (d.payments || [])
            .filter((p: any) => p.paymentTypeId === 'CASH')
            .reduce((sum: number, p: any) => sum + p.totalAmount, 0);
          const digitalPayments = (d.payments || [])
            .filter((p: any) => p.paymentTypeId !== 'CASH' && p.paymentTypeId !== 'DISC.BILL')
            .reduce((sum: number, p: any) => sum + p.totalAmount, 0);

          this.summary.set({
            grossSales: d.totalSales || 0,
            taxCollected: d.totalTax || 0,
            digitalPayments,
            cashExpected: (d.openingBalance || 0) + cashPayments,
            totalTransactions: d.transactionCount || 0,
            openingBalance: d.openingBalance || 0,
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  closeShift(): void {
    const session = this.sessionService.session();
    if (!session?.shiftId) return;

    this.closing.set(true);
    this.http.post<ApiResponse<null>>(`${environment.apiUrl}/shift/close/${session.shiftId}`, {
      physicalCash: this.physicalCashTotal(),
      notes: this.shiftNotes,
    }).subscribe({
      next: (res) => {
        this.closing.set(false);
        if (res.success) {
          this.sessionService.endShift();
          this.router.navigate(['/menu']);
        } else {
          this.errorMessage.set(res.message || 'Close failed');
        }
      },
      error: (err) => {
        this.closing.set(false);
        this.errorMessage.set(err?.error?.message || 'Network error');
      },
    });
  }

  denominationTotal(row: DenominationRow): number {
    return row.value * row.qty;
  }
}
