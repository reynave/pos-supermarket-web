import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CartItem } from '../../../core/models/item.model';
import { Transaction } from '../../../core/models/transaction.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.css',
})
export class ReceiptComponent implements OnInit {
  userName = '';
  terminalId = environment.terminalId;
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    public cartService: CartService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';

    const trxId = this.route.snapshot.queryParamMap.get('id')?.trim() ?? '';
    if (trxId) {
      this.loadReceiptById(trxId);
      return;
    }

    // Fallback for old flow without query param
    if (!this.cartService.lastTransaction()) {
      this.router.navigate(['/cart']);
    }
  }

  private loadReceiptById(id: string): void {
    this.http
      .get<ApiResponse<{ transaction: Transaction; items: CartItem[]; primaryPaymentTypeId: string }>>(
        `${environment.apiUrl}/transactions/${id}`,
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.cartService.lastTransaction.set(res.data.transaction);
            this.cartService.lastCartItems.set(res.data.items ?? []);
            this.cartService.lastPaymentMethod.set((res.data.primaryPaymentTypeId || 'CASH').toLowerCase());
          } else {
            this.loadError = 'Data receipt tidak ditemukan. Silakan cek ID transaksi.';
          }
        },
        error: () => {
          this.loadError = 'Gagal memuat data receipt. Coba refresh halaman.';
        },
      });
  }

  printReceipt(): void {
    // Future: connect to printer service
    window.print();
  }

  newTransaction(): void {
    this.cartService.clearReceipt();
    this.router.navigate(['/cart']);
  }

  goToMenu(): void {
    this.cartService.clearReceipt();
    this.router.navigate(['/menu'], { replaceUrl: true });
  }
}
