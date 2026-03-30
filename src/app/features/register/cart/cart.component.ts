import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Item } from '../../../core/models/item.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyIdrPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  searchQuery = '';
  keypadInput = signal('0');
  currentTime = signal('');
  loading = signal(false);
  errorMessage = signal('');

  userName = '';
  terminalId = environment.terminalId;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    public cartService: CartService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.socketService.connect();
  }

  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  // --- Search & Add Items ---
  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.loading.set(true);

    this.http.get<ApiResponse<Item[]>>(`${environment.apiUrl}/items/search`, { params: { q } }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data?.length) {
          this.cartService.addItem(res.data[0]);
          this.emitDisplayUpdate();
        } else {
          this.errorMessage.set('Item not found');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
        this.searchQuery = '';
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Search failed');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  selectItem(index: number): void {
    this.cartService.selectedIndex.set(index);
  }

  // --- Keypad ---
  onKeypadPress(key: string): void {
    const current = this.keypadInput();
    if (key === 'CLR') {
      this.keypadInput.set('0');
      return;
    }
    if (key === 'backspace') {
      this.keypadInput.set(current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    if (current === '0') {
      this.keypadInput.set(key);
    } else {
      this.keypadInput.set(current + key);
    }
  }

  setQty(): void {
    const idx = this.cartService.selectedIndex();
    const qty = parseInt(this.keypadInput(), 10);
    if (idx < 0 || !qty || qty < 1) return;
    this.cartService.setQty(idx, qty);
    this.keypadInput.set('0');
    this.emitDisplayUpdate();
  }

  // --- Void ---
  voidItem(): void {
    const idx = this.cartService.selectedIndex();
    if (idx >= 0) {
      this.cartService.removeItem(idx);
      this.emitDisplayUpdate();
    }
  }

  voidAll(): void {
    this.cartService.clearCart();
    this.emitDisplayUpdate();
  }

  // --- Navigation ---
  openPayment(): void {
    if (this.cartService.cart().length === 0) return;
    this.router.navigate(['/payment']);
  }

  goToMenu(): void {
    this.router.navigate(['/menu']);
  }

  private updateClock(): void {
    this.currentTime.set(new Date().toLocaleTimeString('en-US', { hour12: false }));
  }

  private emitDisplayUpdate(): void {
    this.socketService.emit('display:update', {
      items: this.cartService.cart(),
      subtotal: this.cartService.subtotal(),
      tax: this.cartService.taxTotal(),
      total: this.cartService.grandTotal(),
    });
  }
}
