import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  openCashDrawer: number;
  edc: number;
  label: string;
  name: string;
  connectionType: string;
  com: string;
  ip: string;
  port: string;
  apikey: string;
  mId: string;
  nmId: string;
  merchant: string;
  timeout: number;
  image: string;
  apiUrl: string;
  apiUrlStatus: string;
  isLock: number;
  status: number;
}

export interface PaidEntry {
  id: number;
  paymentTypeId: string;
  paymentLabel: string;
  paymentName: string;
  paid: number;
  approvedCode: string;
}

export interface VoucherValidationResult {
  valid: boolean;
  reason: string | null;
  voucherCode: string;
  transactionId: string;
  voucherMinAmount: number;
  voucherAllowMultyple: number;
  voucherGiftAmount: number;
  voucherExpDate: string | null;
  status: number;
  presence: number;
  inputDate: string | null;
  inputBy: string | null;
}

export interface VoucherSubmitResult {
  voucher: VoucherValidationResult;
  payments: PaidEntry[];
  totalPaid: number;
}

interface BcaLanPaymentResp {
  ApprovalCode?: string;
  RespCode?: string;
  response?: string;
}

interface BcaLanPaymentResult {
  success: boolean;
  message: string;
  responseMessage?: string;
  resp?: BcaLanPaymentResp;
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
  isPaymentTypeModalOpen = signal(false);
  selectedTypeLabel = computed(() => {
    const selected = this.paymentTypes().find((type) => type.id === this.selectedTypeId());
    return selected?.label || this.selectedTypeId();
  });
  selectedPaymentType = computed(() => {
    return this.paymentTypes().find((type) => type.id === this.selectedTypeId()) || null;
  });
  selectedConnectionType = computed(() => {
    const selected = this.selectedPaymentType();
    return String(selected?.connectionType || 'MANUAL').toUpperCase();
  });
  selectedPaymentTypeFields = computed(() => {
    const selected = this.selectedPaymentType();
    if (!selected) return [] as Array<{ key: string; value: string | number }>;

    const excluded = new Set(['presence', 'inputBy', 'inputDate', 'updateBy', 'updateDate']);
    return Object.entries(selected)
      .filter(([key]) => !excluded.has(key))
      .map(([key, value]) => ({ key, value: typeof value === 'number' ? value : String(value || '-') }));
  });

  // Entry amount keypad
  entryAmount = signal('0');

  // Voucher validation (shown only for VOUCHER payment type)
  voucherIdInput = signal('');
  voucherValidationMessage = signal('');
  voucherValid = signal(false);
  voucherAmount = signal(0);
  voucherValidationLoading = signal(false);
  voucherSubmitLoading = signal(false);

  // Paid entries table
  paidEntries = signal<PaidEntry[]>([]);
  totalPaid = signal(0);

  // Loading / error
  paymentLoading = signal(false);
  addLoading = signal(false);
  completeLoading = signal(false);
  edcWaiting = signal(false);
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
          {
            id: 'CASH',
            openCashDrawer: 1,
            edc: 0,
            label: 'CASH',
            name: 'Cash',
            connectionType: 'MANUAL',
            com: '',
            ip: '',
            port: '',
            apikey: '',
            mId: '',
            nmId: '',
            merchant: '',
            timeout: 0,
            image: '',
            apiUrl: '',
            apiUrlStatus: '',
            isLock: 1,
            status: 1,
          },
          {
            id: 'DEBITCC',
            openCashDrawer: 0,
            edc: 0,
            label: 'MANUAL DEBIT CARD',
            name: 'Debit / Card',
            connectionType: 'MANUAL',
            com: '',
            ip: '',
            port: '',
            apikey: '',
            mId: '',
            nmId: '',
            merchant: '',
            timeout: 0,
            image: '',
            apiUrl: '',
            apiUrlStatus: '',
            isLock: 1,
            status: 1,
          },
        ]);
      },
    });
  }

  selectType(id: string): void {
    this.selectedTypeId.set(id);
    // Pre-fill remaining amount when selecting a payment type
    const remaining = this.remaining();
    this.entryAmount.set(remaining > 0 ? String(remaining) : '0');
    this.voucherIdInput.set('');
    this.voucherValidationMessage.set('');
    this.voucherValid.set(false);
    this.voucherAmount.set(0);
    this.isPaymentTypeModalOpen.set(false);
  }

  onVoucherInputChange(value: string): void {
    this.voucherIdInput.set(String(value || '').toUpperCase());
    this.voucherValid.set(false);
    this.voucherAmount.set(0);
    this.voucherValidationMessage.set('');
  }

  validateVoucherId(): void {
    const rawCode = this.voucherIdInput().trim().toUpperCase();
    this.voucherIdInput.set(rawCode);

    if (!rawCode) {
      this.voucherValid.set(false);
      this.voucherValidationMessage.set('Voucher ID wajib diisi');
      return;
    }

    this.voucherValidationLoading.set(true);
    this.http
      .get<ApiResponse<VoucherValidationResult>>(
        `${environment.apiUrl}/voucher/${encodeURIComponent(rawCode)}`,
      )
      .subscribe({
        next: (res) => {
          this.voucherValidationLoading.set(false);

          if (!res.success || !res.data) {
            this.voucherValid.set(false);
            this.voucherAmount.set(0);
            this.voucherValidationMessage.set(res.message || 'Voucher tidak valid');
            return;
          }

          this.voucherValid.set(res.data.valid);
          this.voucherAmount.set(Number(res.data.voucherGiftAmount || 0));
          this.entryAmount.set(String(Number(res.data.voucherGiftAmount || 0)));
          this.voucherValidationMessage.set(
            res.data.valid
              ? `Voucher valid. Nominal ${Number(res.data.voucherGiftAmount || 0).toLocaleString('id-ID')}`
              : (res.data.reason || 'Voucher tidak valid'),
          );
        },
        error: (err) => {
          this.voucherValidationLoading.set(false);
          this.voucherValid.set(false);
          this.voucherAmount.set(0);
          this.voucherValidationMessage.set(err?.error?.message || 'Gagal validasi voucher');
        },
      });
  }

  submitVoucher(): void {
    const kioskUuid = this.cartService.kioskUuid();
    const voucherCode = this.voucherIdInput().trim().toUpperCase();

    if (!kioskUuid) return;
    if (!voucherCode) {
      this.voucherValidationMessage.set('Voucher ID wajib diisi');
      return;
    }
    if (!this.voucherValid()) {
      this.voucherValidationMessage.set('Validasi voucher dulu sebelum submit');
      return;
    }

    this.voucherSubmitLoading.set(true);
    this.http
      .post<ApiResponse<VoucherSubmitResult>>(`${environment.apiUrl}/voucher/use`, {
        kioskUuid,
        voucherCode,
      })
      .subscribe({
        next: (res) => {
          this.voucherSubmitLoading.set(false);

          if (!res.success || !res.data) {
            this.voucherValidationMessage.set(res.message || 'Submit voucher gagal');
            return;
          }

          this.paidEntries.set(res.data.payments);
          this.totalPaid.set(res.data.totalPaid);
          this.voucherValid.set(false);
          this.voucherAmount.set(0);
          this.entryAmount.set('0');
          this.voucherIdInput.set('');
          this.voucherValidationMessage.set(`Voucher ${voucherCode} berhasil dipakai`);
          this.emitDisplayReload();
        },
        error: (err) => {
          this.voucherSubmitLoading.set(false);
          this.voucherValidationMessage.set(err?.error?.message || 'Submit voucher gagal');
        },
      });
  }

  openPaymentTypeModal(): void {
    this.isPaymentTypeModalOpen.set(true);
  }

  closePaymentTypeModal(): void {
    this.isPaymentTypeModalOpen.set(false);
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

  async addPayment(): Promise<void> {
    const activePaymentType = this.paymentTypes().find(
      (type) => type.id === this.selectedTypeId(),
    );
    if (!activePaymentType) {
      this.errorMessage.set('Tipe pembayaran tidak ditemukan');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    const paid = parseInt(this.entryAmount(), 10);
    if (!paid || paid < 1) {
      this.errorMessage.set('Jumlah pembayaran tidak valid');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

    const connectionType = String(activePaymentType.connectionType || 'MANUAL').trim().toUpperCase();

    if (connectionType === 'LAN' || connectionType === 'COM' || connectionType === 'API') {
      this.errorMessage.set('Gunakan tombol Send to EDC untuk tipe koneksi ini');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    await this.submitPaymentEntry(kioskUuid, paid, '');
  }

  async sendToEDC(): Promise<void> {
    const activePaymentType = this.paymentTypes().find(
      (type) => type.id === this.selectedTypeId(),
    );
    if (!activePaymentType) {
      this.errorMessage.set('Tipe pembayaran tidak ditemukan');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    const paid = parseInt(this.entryAmount(), 10);
    if (!paid || paid < 1) {
      this.errorMessage.set('Jumlah pembayaran tidak valid');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

    const connectionType = String(activePaymentType.connectionType || 'MANUAL').trim().toUpperCase();

    if (connectionType === 'COM') {
      alert('COM on progress');
      return;
    }

    if (connectionType === 'API') {
      alert('API on Progress');
      return;
    }

    if (connectionType !== 'LAN') {
      this.errorMessage.set('Tipe pembayaran ini tidak menggunakan EDC');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    this.addLoading.set(true);
    this.edcWaiting.set(true);

    try {
      const edcResult = await this.requestEdcLan(activePaymentType, paid);
      const approvedCode = String(edcResult.resp?.ApprovalCode || '').trim();

      if (!approvedCode) {
        throw new Error('Transaction failed');
      }

      await this.submitPaymentEntry(kioskUuid, paid, approvedCode);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal menambah pembayaran';
      this.errorMessage.set(message);
      setTimeout(() => this.errorMessage.set(''), 3000);
    } finally {
      this.edcWaiting.set(false);
      this.addLoading.set(false);
    }
  }

  private async submitPaymentEntry(kioskUuid: string, paid: number, approvedCode: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<{ id: number; payments: PaidEntry[]; totalPaid: number }>>(
        `${environment.apiUrl}/payment/add`,
        {
          kioskUuid,
          paymentTypeId: this.selectedTypeId(),
          paid,
          approvedCode,
        },
      ),
    );

    if (res.success && res.data) {
      this.paidEntries.set(res.data.payments);
      this.totalPaid.set(res.data.totalPaid);
      this.entryAmount.set('0');
      this.emitDisplayReload();
      return;
    }

    throw new Error(res.message || 'Gagal menambah pembayaran');
  }

  private async requestEdcLan(paymentType: PaymentType, amount: number): Promise<BcaLanPaymentResult> {
    const ip = String(paymentType.ip || '').trim();
    const port = String(paymentType.port || '').trim();
    const transType = this.getEdcTransType(paymentType.id);

    if (!ip) {
      throw new Error('IP payment type LAN belum diisi');
    }

    const res = await firstValueFrom(
      this.http.post<BcaLanPaymentResult>(`${environment.apiUrl}/payment/bca-lan/payment`, {
        amount,
        transType,
        ip,
        port,
      }),
    );

    if (!res.success) {
      throw new Error(res.message || 'Gagal menghubungi EDC LAN');
    }

    return res;
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
    if (id === 'VOUCHER') return 'redeem';
    if (id.includes('QRIS')) return 'qr_code_2';
    return 'credit_card';
  }

  private getEdcTransType(paymentTypeId: string): string {
    const normalizedId = String(paymentTypeId || '').trim().toUpperCase();

    if (normalizedId === 'BCA31') {
      return '31';
    }

    if (normalizedId === 'BCA01') {
      return '01';
    }

    return '01';
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
