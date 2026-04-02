import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { environment } from '../../../../environments/environment';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { CashDeclarationPayload, DailyCloseService, DailyCloseSummaryResponse } from '../../../core/services/daily-close.service';
import { ApiResponse } from '../../../core/models/api-response.model';

interface ShiftSummary {
  grossSales: number;
  taxCollected: number;
  digitalPayments: number;
  cashExpected: number;
  totalTransactions: number;
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
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
  cashierId = '';

  shiftNotes = '';
  coinsOther = 0;
  private cashInputVersion = signal(0);

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
    totalCashIn: 0,
    totalCashOut: 0,
  });

  physicalCashTotal = computed(() => {
    this.cashInputVersion();
    const denomTotal = this.denominations.reduce((sum, d) => sum + Number(d.value) * Number(d.qty || 0), 0);
    return denomTotal + Number(this.coinsOther || 0);
  });

  discrepancy = computed(() => this.physicalCashTotal() - this.summary().cashExpected);

  activeTab = signal<'eod' | 'history'>('eod');

  constructor(
    private router: Router,
    private dailyCloseService: DailyCloseService,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? '';
    this.userRole = user?.role ?? '';
    this.cashierId = String(user?.id ?? '');
    this.loadSummary();
  }

  private loadSummary(): void {
    const session = this.sessionService.session();
    const sessionId = session?.resetId || session?.shiftId;
    if (!sessionId) return;

    this.loading.set(true);
    this.dailyCloseService.getSummary(sessionId).subscribe({
      next: (res: ApiResponse<DailyCloseSummaryResponse>) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const d = res.data;
          const totalCashIn = Number(d.balanceSummary?.totalCashIn || 0);
          const totalCashOut = Number(d.balanceSummary?.totalCashOut || 0);
          const digitalPayments = (d.payments || [])
            .filter((p) => p.paymentTypeId !== 'CASH' && p.paymentTypeId !== 'DISC.BILL')
            .reduce((sum, p) => sum + Number(p.paidAmount || 0), 0);

          this.summary.set({
            grossSales: Number(d.reset?.overalFinalPrice || 0),
            taxCollected: Number(d.reset?.overalTax || 0),
            digitalPayments,
            cashExpected: totalCashIn - totalCashOut,
            totalTransactions: Number(d.reset?.totalTransaction || 0),
            openingBalance: d.openingBalance || 0,
            totalCashIn,
            totalCashOut,
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  closeShift(): void {
    const session = this.sessionService.session();
    const sessionId = session?.resetId || session?.shiftId;
    if (!sessionId) return;

    this.closing.set(true);
    const cashDeclaration: CashDeclarationPayload = {
      denom_100k: this.getQtyByValue(100000),
      denom_50k: this.getQtyByValue(50000),
      denom_20k: this.getQtyByValue(20000),
      denom_10k: this.getQtyByValue(10000),
      denom_5k: this.getQtyByValue(5000),
      denom_2k: this.getQtyByValue(2000),
      denom_1k: this.getQtyByValue(1000),
      coins_other: Number(this.coinsOther || 0),
    };

    this.dailyCloseService.submit(sessionId, {
      terminalId: environment.terminalId,
      physicalCash: this.physicalCashTotal(),
      notes: this.shiftNotes,
      cashDeclaration,
    }).subscribe({
      next: (res: ApiResponse<any>) => {
        this.closing.set(false);
        if (res.success) {
          this.sessionService.endShift();
          this.router.navigate(['/menu']);
        } else {
          this.errorMessage.set(res.message || 'Close failed');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.closing.set(false);
        this.errorMessage.set(err?.error?.message || 'Network error');
      },
    });
  }

  denominationTotal(row: DenominationRow): number {
    return Number(row.value) * Number(row.qty || 0);
  }

  onQtyChange(row: DenominationRow, value: number | string): void {
    const parsed = Number(value);
    row.qty = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    this.cashInputVersion.update((v) => v + 1);
  }

  onCoinsOtherChange(value: number | string): void {
    const parsed = Number(value);
    this.coinsOther = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    this.cashInputVersion.update((v) => v + 1);
  }

  private getQtyByValue(value: number): number {
    const row = this.denominations.find((d) => d.value === value);
    return Number(row?.qty || 0);
  }
}
