import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { SocketService } from '../../../core/services/socket.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Transaction } from '../../../core/models/transaction.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

export interface PaymentType {
  id: string;
  label: string;
  name: string;
  image: string;
  edc: number;
  isLock: number;
}

export interface PaidEntry {
  id: number;
  paymentTypeId: string;
  paymentLabel: string;
  paymentName: string;
  paid: number;
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyIdrPipe, HeaderComponent],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit {
  private readonly KIOSK_KEY = 'pos_kiosk_uuid';

  // Payment type panel
  paymentTypes = signal<PaymentType[]>([]);
  selectedTypeId = signal<string>('CASH');

  // Entry amount keypad
  entryAmount = signal('0');

  // Paid entries table
  paidEntries = signal<PaidEntry[]>([]);
  totalPaid = signal(0);

  // Loading / error
  paymentLoading = signal(false);
  addLoading = signal(false);
  completeLoading = signal(false);
  errorMessage = signal('');

  userName = '';

  // Remaining amount still needed
  remaining = computed(() => Math.max(0, this.cartService.grandTotal() - this.totalPaid()));

  // Whether total paid covers the bill
  isPaid = computed(() => this.totalPaid() >= this.cartService.grandTotal());

  // Change due (only meaningful if cash overpaid)
  changeDue = computed(() => Math.max(0, this.totalPaid() - this.cartService.grandTotal()));

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    public cartService: CartService,
    private sessionService: SessionService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
    this.loadPaymentTypes();
    this.restoreSessionAndTotals();
  }

  private restoreSessionAndTotals(): void {
    // Prefer in-memory signal, then fallback to localStorage when page is refreshed.
    let kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) {
      kioskUuid = localStorage.getItem(this.KIOSK_KEY) ?? '';
      if (kioskUuid) {
        this.cartService.setKioskUuid(kioskUuid);
      }
    }

    if (!kioskUuid) return;

    this.paymentLoading.set(true);
    this.cartService.loadCart(kioskUuid).subscribe({
      next: () => {
        this.paymentLoading.set(false);
        this.loadPendingPayments();
      },
      error: () => {
        this.paymentLoading.set(false);
        this.errorMessage.set('Gagal memuat ulang total tagihan');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  // ─── Payment Types ────────────────────────────────────────────────────────

  private loadPaymentTypes(): void {
    this.http.get<ApiResponse<PaymentType[]>>(`${environment.apiUrl}/payment/types`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Filter out EDC/internal types for simple UI; keep CASH, DEBITCC, QRIS etc.
          const visible = res.data.filter((t) => t.isLock === 1);
          this.paymentTypes.set(visible);
          if (visible.length && !visible.find((t) => t.id === this.selectedTypeId())) {
            this.selectedTypeId.set(visible[0].id);
          }
        }
      },
      error: () => {
        // Fallback to static list if API fails
        this.paymentTypes.set([
          { id: 'CASH', label: 'CASH', name: 'Cash', image: '', edc: 0, isLock: 1 },
          { id: 'DEBITCC', label: 'MANUAL DEBIT CARD', name: 'Debit / Card', image: '', edc: 0, isLock: 1 },
          { id: 'QRISTELKOM', label: 'QRIS TELKOM', name: 'QRIS', image: '', edc: 0, isLock: 1 },
        ]);
      },
    });
  }

  selectType(id: string): void {
    this.selectedTypeId.set(id);
    // Pre-fill remaining amount when selecting a payment type
    const remaining = this.remaining();
    this.entryAmount.set(remaining > 0 ? String(remaining) : '0');
  }

  // ─── Keypad ───────────────────────────────────────────────────────────────

  onKey(key: string): void {
    const current = this.entryAmount();
    if (key === 'backspace') {
      this.entryAmount.set(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    if (key === 'CLR') {
      this.entryAmount.set('0');
      return;
    }
    if (current === '0') {
      this.entryAmount.set(key);
    } else {
      this.entryAmount.set(current + key);
    }
  }

  setExactRemaining(): void {
    this.entryAmount.set(String(this.remaining()));
  }

  setExactTotal(): void {
    this.entryAmount.set(String(this.cartService.grandTotal()));
  }

  // ─── Pending Payments ─────────────────────────────────────────────────────

  private loadPendingPayments(): void {
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;
    this.http
      .get<ApiResponse<{ payments: PaidEntry[]; totalPaid: number }>>(
        `${environment.apiUrl}/payment/pending/${kioskUuid}`,
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.paidEntries.set(res.data.payments);
            this.totalPaid.set(res.data.totalPaid);
            this.emitDisplayReload();
          }
        },
        error: () => {},
      });
  }

  addPayment(): void {
    const paid = parseInt(this.entryAmount(), 10);
    if (!paid || paid < 1) {
      this.errorMessage.set('Jumlah pembayaran tidak valid');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

    this.addLoading.set(true);
    this.http
      .post<ApiResponse<{ id: number; payments: PaidEntry[]; totalPaid: number }>>(
        `${environment.apiUrl}/payment/add`,
        {
          kioskUuid,
          paymentTypeId: this.selectedTypeId(),
          paid,
        },
      )
      .subscribe({
        next: (res) => {
          this.addLoading.set(false);
          if (res.success && res.data) {
            this.paidEntries.set(res.data.payments);
            this.totalPaid.set(res.data.totalPaid);
            this.entryAmount.set('0');
            this.emitDisplayReload();
          } else {
            this.errorMessage.set('Gagal menambah pembayaran');
            setTimeout(() => this.errorMessage.set(''), 3000);
          }
        },
        error: (err) => {
          this.addLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Gagal menambah pembayaran');
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
  }

  removePayment(entry: PaidEntry): void {
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

    this.http
      .delete<ApiResponse<{ payments: PaidEntry[]; totalPaid: number }>>(
        `${environment.apiUrl}/payment/${entry.id}`,
        { body: { kioskUuid } },
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.paidEntries.set(res.data.payments);
            this.totalPaid.set(res.data.totalPaid);
            this.emitDisplayReload();
          }
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message || 'Gagal menghapus pembayaran');
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
  }

  // ─── Complete ─────────────────────────────────────────────────────────────

  completePayment(): void {
    if (!this.isPaid()) return;

    const kioskUuid = this.cartService.kioskUuid();
    const session = this.sessionService.session();
    if (!kioskUuid || !session) return;

    const cashEntry = this.paidEntries().find((e) => e.paymentTypeId === 'CASH');
    const sessionId = session.resetId || session.settlementId || session.shiftId || '';
    const body: Record<string, unknown> = {
      kioskUuid,
      terminalId: environment.terminalId,
      resetId: sessionId,
      settlementId: sessionId,
    };
    if (cashEntry) body['cashReceived'] = this.totalPaid();

    this.completeLoading.set(true);

    this.http.post<ApiResponse<Transaction>>(`${environment.apiUrl}/payment/complete`, body).subscribe({
      next: (res) => {
        this.completeLoading.set(false);
        if (res.success && res.data) {
          const primaryMethod = this.paidEntries()[0]?.paymentTypeId?.toLowerCase() ?? 'cash';
          this.cartService.saveForReceipt(res.data, primaryMethod);
          this.cartService.clearKioskUuid();
          this.emitDisplayReload(true);
          this.router.navigate(['/receipt'], { queryParams: { id: res.data.id }, replaceUrl: true });
        } else {
          this.errorMessage.set('Pembayaran gagal diselesaikan');
          setTimeout(() => this.errorMessage.set(''), 4000);
        }
      },
      error: (err) => {
        this.completeLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Pembayaran gagal diselesaikan');
        setTimeout(() => this.errorMessage.set(''), 4000);
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  paymentTypeIcon(id: string): string {
    if (id === 'CASH') return 'payments';
    if (id.includes('QRIS')) return 'qr_code_2';
    return 'credit_card';
  }

  private emitDisplayReload(forceClear = false): void {
    this.socketService.emit('display:update', {
      kioskUuid: this.cartService.kioskUuid(),
      forceClear,
      refreshAt: Date.now(),
    });
  }

  goBack(): void {
    history.back();
  }
}
