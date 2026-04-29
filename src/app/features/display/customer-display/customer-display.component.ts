import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SocketService } from '../../../core/services/socket.service';
import { CartItem } from '../../../core/models/item.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { environment } from '../../../../environments/environment';

interface DisplayPayment {
  id: number;
  paymentTypeId: string;
  paymentLabel: string;
  paymentName: string;
  paid: number;
}

interface DisplayData {
  items?: CartItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  payments?: DisplayPayment[];
  kioskUuid?: string;
  forceClear?: boolean;
}

interface CartSnapshotItem {
  itemId: string;
  name: string;
  barcode: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  uom: string;
  promotionName?: string | null;
  isFreeItem?: boolean;
}

interface CartSnapshotResponse {
  items: CartSnapshotItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
}

@Component({
  selector: 'app-customer-display',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './customer-display.component.html',
  styleUrl: './customer-display.component.css',
})
export class CustomerDisplayComponent implements OnInit, OnDestroy {
  private readonly KIOSK_KEY = 'pos_kiosk_uuid';
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  items = signal<CartItem[]>([]);
  payments = signal<DisplayPayment[]>([]);
  subtotal = signal(0);
  tax = signal(0);
  grandTotal = signal(0);
  currentTime = signal('');
  terminalId = environment.terminalId;

  savings = computed(() => this.items().reduce((sum, item) => sum + item.discount, 0));
  totalPaid = computed(() => this.payments().reduce((sum, payment) => sum + payment.paid, 0));
  remainingBalance = computed(() => Math.max(0, this.grandTotal() - this.totalPaid()));

  constructor(
    private socketService: SocketService,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.on('display:update', (data: unknown) => {
      const payload = data as DisplayData;
      if (payload.forceClear) {
        this.clearDisplay();
        return;
      }

      this.restoreDisplaySnapshot(payload.kioskUuid);
    });
    this.restoreDisplaySnapshot();
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    this.socketService.off('display:update');
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private updateClock(): void {
    this.currentTime.set(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  }

  paymentTypeIcon(paymentTypeId: string): string {
    if (paymentTypeId === 'CASH') return 'payments';
    if (paymentTypeId.includes('QRIS')) return 'qr_code_2';
    return 'credit_card';
  }

  private restoreDisplaySnapshot(kioskUuidFromSocket?: string): void {
    const kioskUuid = (kioskUuidFromSocket ?? localStorage.getItem(this.KIOSK_KEY) ?? '').trim();
    if (!kioskUuid) return;

    localStorage.setItem(this.KIOSK_KEY, kioskUuid);

    this.http.get<any>(`${environment.apiUrl}/cart/list/${kioskUuid}`).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.items.set(
            (res.data.items ?? []).map((item: any, index: number) => ({
              id: `${item.itemId}-${index}`,
              itemId: item.itemId,
              name: item.name,
              barcode: item.barcode,
              qty: item.qty,
              price: item.price,
              discount: item.discount,
              tax: item.tax,
              total: item.total,
              uom: item.uom,
              promotionName: item.promotionName ?? null,
              isFreeItem: Boolean(item.isFreeItem),
            })),
          );
          this.subtotal.set(res.data.subtotal ?? 0);
          this.tax.set(res.data.tax ?? 0);
          this.grandTotal.set(res.data.grandTotal ?? 0);
        } else {
          this.clearDisplay();
        }
      },
      error: () => {
        this.clearDisplay();
      },
    });

    this.http
      .get<any>(`${environment.apiUrl}/payment/pending/${kioskUuid}`)
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.payments.set((res.data.payments ?? []).map((payment: any) => this.normalizePayment(payment)));
          } else {
            this.payments.set([]);
          }
        },
        error: () => {
          this.payments.set([]);
        },
      });
  }

  private clearDisplay(): void {
    localStorage.removeItem(this.KIOSK_KEY);
    this.items.set([]);
    this.payments.set([]);
    this.subtotal.set(0);
    this.tax.set(0);
    this.grandTotal.set(0);
  }

  private normalizePayment(payment: DisplayPayment): DisplayPayment {
    return {
      ...payment,
      paid: Number(payment.paid ?? 0),
    };
  }
}
