import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Transaction } from '../../../core/models/transaction.model';
import { SessionService } from '../../../core/services/session.service';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

interface ShiftSummaryResponse {
  openingBalance: number;
  payments: Array<{ paymentTypeId: string; count: number; totalAmount: number }>;
}

interface CashBalanceRow {
  dateTime: string;
  billNo: string;
  cashIn: number;
  cashOut: number;
  cashierName: string;
}

@Component({
  selector: 'app-cash-balance',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe, RouterModule],
  templateUrl: './cash-balance.component.html',
  styleUrl: './cash-balance.component.css',
})
export class CashBalanceComponent implements OnInit {
  loading = signal(false);
  selectedDate = signal(new Date());
  currentPage = signal(1);
  pageSize = 20;

  openingBalance = signal(0);
  cashRows = signal<CashBalanceRow[]>([]);
  totalItems = signal(0);
  errorMessage = signal('');

  totalCashIn = computed(() =>
    this.cashRows().reduce((sum, row) => sum + row.cashIn, 0),
  );

  totalCashOut = computed(() =>
    this.cashRows().reduce((sum, row) => sum + row.cashOut, 0),
  );

  currentCashBalance = computed(() =>
    this.openingBalance() + this.totalCashIn() - this.totalCashOut(),
  );

  activeSettlementId = computed(() => this.sessionService.session()?.settlementId || '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get formattedDate(): string {
    return this.selectedDate().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  prevDate(): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() - 1);
    this.selectedDate.set(next);
    this.currentPage.set(1);
    this.loadData();
  }

  nextDate(): void {
    const next = new Date(this.selectedDate());
    next.setDate(next.getDate() + 1);
    this.selectedDate.set(next);
    this.currentPage.set(1);
    this.loadData();
  }

  prevPage(): void {
    if (this.currentPage() <= 1) return;
    this.currentPage.update((page) => page - 1);
    this.loadTransactions();
  }

  nextPage(): void {
    this.currentPage.update((page) => page + 1);
    this.loadTransactions();
  }

  goToMenu(): void {
    this.router.navigate(['/menu']);
  }

  private loadData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const settlementId = this.activeSettlementId();
    if (!settlementId) {
      this.openingBalance.set(0);
      this.loadTransactions();
      return;
    }

    this.http.get<ApiResponse<ShiftSummaryResponse>>(
      `${environment.apiUrl}/shift/summary/${settlementId}`,
    ).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.openingBalance.set(Number(res.data.openingBalance || 0));
        }
        this.loadTransactions();
      },
      error: () => {
        this.openingBalance.set(0);
        this.loadTransactions();
      },
    });
  }

  private loadTransactions(): void {
    const dateStr = this.selectedDate().toISOString().split('T')[0];

    this.http.get<ApiResponse<{ items: Transaction[]; total: number }>>(
      `${environment.apiUrl}/transactions`,
      { params: { date: dateStr, page: this.currentPage(), limit: this.pageSize } },
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!res.success || !res.data) {
          this.cashRows.set([]);
          this.totalItems.set(0);
          return;
        }

        const rows = (res.data.items || [])
          .filter((trx) => trx.status === 1)
          .map((trx) => this.toCashBalanceRow(trx));

        this.cashRows.set(rows);
        this.totalItems.set(res.data.total || 0);
      },
      error: (err) => {
        this.loading.set(false);
        this.cashRows.set([]);
        this.totalItems.set(0);
        this.errorMessage.set(err?.error?.message || 'Gagal memuat data cash balance');
      },
    });
  }

  private toCashBalanceRow(trx: Transaction): CashBalanceRow {
    const amount = Number(trx.grandTotal || 0);

    return {
      dateTime: trx.inputDate,
      billNo: trx.id,
      cashIn: amount >= 0 ? amount : 0,
      cashOut: amount < 0 ? Math.abs(amount) : 0,
      cashierName: trx.cashierName || trx.cashierId || '-',
    };
  }
}
