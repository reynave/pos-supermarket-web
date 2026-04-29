import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { environment } from '../../../../environments/environment';
import { SessionService } from '../../../core/services/session.service';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

interface CashBalanceHistoryResponse {
  openingBalance: number;
  items: CashBalanceRow[];
  total: number;
  resetOptions: string[];
}

interface CashBalanceRow {
  resetId: string;
  dateTime: string;
  billNo: string;
  cashIn: number;
  cashOut: number;
  cashierName: string;
  rowType: 'OPENING' | 'MANUAL_CASH_IN' | 'TRANSACTION';
}

@Component({
  selector: 'app-cash-balance',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe, RouterModule, HeaderComponent],
  templateUrl: './cash-balance.component.html',
  styleUrl: './cash-balance.component.css',
})
export class CashBalanceComponent implements OnInit {
  loading = signal(false);
  selectedResetId = signal('');
  userName = '';

  openingBalance = signal(0);
  cashRows = signal<CashBalanceRow[]>([]);
  totalItems = signal(0);
  errorMessage = signal('');

  totalCashIn = computed(() =>
    this.cashRows()
      .filter((row) => row.rowType !== 'OPENING')
      .reduce((sum, row) => sum + Number(row.cashIn || 0), 0),
  );

  totalCashOut = computed(() =>
    this.cashRows()
      .filter((row) => row.rowType !== 'OPENING')
      .reduce((sum, row) => sum + Number(row.cashOut || 0), 0),
  );

  currentCashBalance = computed(() =>
    this.openingBalance() + this.totalCashIn() - this.totalCashOut(),
  );

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private sessionService: SessionService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';
    const activeResetId = this.sessionService.session()?.resetId || this.sessionService.session()?.shiftId || '';
    this.selectedResetId.set(activeResetId);
    this.loadData();
  }

  goBack(): void {
    history.back();
  }

  goToMenu(): void {
    this.router.navigate(['/menu']);
  }

  private loadData(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<any>(
      `${environment.apiUrl}/manual-cash/history`,
      { params: { ...(this.selectedResetId() ? { resetId: this.selectedResetId() } : {}) } },
    ).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (!res.success || !res.data) {
          this.cashRows.set([]);
          this.totalItems.set(0);
          return;
        }

        this.openingBalance.set(Number(res.data.openingBalance || 0));
        this.cashRows.set(res.data.items || []);
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
}
