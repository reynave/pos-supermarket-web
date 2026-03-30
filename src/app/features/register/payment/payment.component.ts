import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SessionService } from '../../../core/services/session.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Transaction } from '../../../core/models/transaction.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css',
})
export class PaymentComponent implements OnInit {
  paymentMethod = signal<'cash' | 'card' | 'qris'>('cash');
  cashReceived = signal('0');
  paymentLoading = signal(false);
  errorMessage = signal('');

  userName = '';
  terminalId = environment.terminalId;

  changeDue = computed(() => {
    const received = parseFloat(this.cashReceived()) || 0;
    return Math.max(0, received - this.cartService.grandTotal());
  });

  canCompleteCash = computed(() => {
    const received = parseFloat(this.cashReceived()) || 0;
    return received >= this.cartService.grandTotal();
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    public cartService: CartService,
    private sessionService: SessionService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    // If no items in cart, redirect back
   /* if (this.cartService.cart().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }*/
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
  }

  selectPaymentMethod(method: 'cash' | 'card' | 'qris'): void {
    this.paymentMethod.set(method);
    this.cashReceived.set('0');
  }

  onCashKey(key: string): void {
    const current = this.cashReceived();
    if (key === 'backspace') {
      this.cashReceived.set(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    if (current === '0') {
      this.cashReceived.set(key);
    } else {
      this.cashReceived.set(current + key);
    }
  }

  setExactAmount(): void {
    this.cashReceived.set(String(this.cartService.grandTotal()));
  }

  completePayment(): void {
    const method = this.paymentMethod();
    if (method === 'cash') {
      const received = parseFloat(this.cashReceived()) || 0;
      if (received < this.cartService.grandTotal()) return;
    }
    this.paymentLoading.set(true);

    const session = this.sessionService.session();
    const body = {
      terminalId: environment.terminalId,
      shiftId: session?.shiftId,
      items: this.cartService.cart().map((c) => ({
        itemId: c.itemId,
        qty: c.qty,
        price: c.price,
        discount: c.discount,
      })),
      payments: [{
        paymentTypeId: method === 'cash' ? 1 : method === 'card' ? 2 : 3,
        amount: this.cartService.grandTotal(),
        reference: '',
      }],
    };

    this.http.post<ApiResponse<Transaction>>(`${environment.apiUrl}/transactions`, body).subscribe({
      next: (res) => {
        this.paymentLoading.set(false);
        if (res.success && res.data) {
          this.cartService.saveForReceipt(res.data, method);
          this.socketService.emit('display:update', { items: [], subtotal: 0, tax: 0, total: 0 });
          this.router.navigate(['/receipt']);
        }
      },
      error: (err) => {
        this.paymentLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Payment failed');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/cart']);
  }
}
