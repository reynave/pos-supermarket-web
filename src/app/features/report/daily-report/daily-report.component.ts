import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Transaction } from '../../../core/models/transaction.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-daily-report',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe, HeaderComponent],
  templateUrl: './daily-report.component.html',
  styleUrl: './daily-report.component.css',
})
export class DailyReportComponent implements OnInit {
  transactions = signal<Transaction[]>([]);
  loading = signal(false);
  selectedDate = signal(new Date());
  currentPage = signal(1);
  totalItems = signal(0);
  pageSize = 20;
  userName = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';
    this.loadTransactions();
  }

  get formattedDate(): string {
    return this.selectedDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  prevDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.selectedDate.set(d);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  nextDate(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.selectedDate.set(d);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadTransactions();
    }
  }

  nextPage(): void {
    this.currentPage.update((p) => p + 1);
    this.loadTransactions();
  }

  goToMenu(): void {
    this.router.navigate(['/menu']);
  }

  openReceipt(trxId: string): void {
    if (!trxId) return;
    this.router.navigate(['/receipt'], { queryParams: { id: trxId } });
  }

  getPaymentBadgeClass(status: number): string {
    switch (status) {
      case 1: return 'bg-blue-100 text-blue-700';
      case 2: return 'bg-emerald-100 text-emerald-700';
      case 3: return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getPaymentLabel(status: number): string {
    switch (status) {
      case 1: return 'Cash';
      case 2: return 'Card';
      case 3: return 'QRIS';
      default: return 'Other';
    }
  }

  private loadTransactions(): void {
    this.loading.set(true);
    const dateStr = this.selectedDate().toISOString().split('T')[0];
    this.http.get<ApiResponse<{ items: Transaction[]; total: number }>>(
      `${environment.apiUrl}/transactions`,
      { params: { date: dateStr, page: this.currentPage(), limit: this.pageSize } },
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.transactions.set(res.data.items ?? []);
          this.totalItems.set(res.data.total ?? 0);
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
