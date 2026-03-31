import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ItemService } from '../../../core/services/item.service';
import { SocketService } from '../../../core/services/socket.service';
import { environment } from '../../../../environments/environment';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { AutoFocusDirective } from '../../../shared/directives/auto-focus.directive';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyIdrPipe, AutoFocusDirective],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit, OnDestroy {
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  searchQuery : string = '';
  keypadInput = signal('0');
  currentTime = signal('');
  loading = signal(false);
  errorMessage = signal('');

  // Void Cart modal
  showVoidModal = signal(false);
  voidVerificationId = signal('');

  // Void Item modal
  showVoidItemModal = signal(false);
  voidItemQty = signal(1);
  voidItemIndex = signal(-1);

  userName = '';
  terminalId = environment.terminalId;

  constructor(
    private router: Router,
    private authService: AuthService,
    public cartService: CartService,
    private itemService: ItemService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
    this.socketService.connect();

    // Auto-create kioskUuid (cart session) if none exists
    if (!this.cartService.kioskUuid()) {
      this.initCartSession();
    } else {
      // Session exists → load cart items from backend
      this.httpGetItem();
    }
  }

  /** GET /api/cart/list/:kioskUuid — reload cart items from backend */
  httpGetItem(): void {
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

    this.loading.set(true);
    this.cartService.loadCart(kioskUuid).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data) {
          this.emitDisplayUpdate();
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to load cart');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }


  ngOnDestroy(): void {
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  /** Create new cart session via POST /api/cart/new */
  private initCartSession(): void {
    const user = this.authService.currentUser();
    this.cartService.createNewCart(
      user?.id ?? '',
      environment.terminalId,
      environment.storeOutletId,
    ).subscribe({
      next: (res) => {
        if (!res.success) {
          this.errorMessage.set('Failed to create cart session');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      },
      error: () => {
        this.errorMessage.set('Failed to create cart session');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }


  // Search barcode & add item to cart
  // POST /api/item/barcode → lookup + insert to kiosk_cart on backend
  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.searchQuery = '';
    this.scanBarcode(q);
  }

  /** Keypad ENTER — use keypad value as barcode input */
  private searchByKeypad(): void {
    const q = this.keypadInput().trim();
    if (!q || q === '0') return;
    this.keypadInput.set('0');
    this.scanBarcode(q);
  }

  /** Shared: scan barcode via POST /api/item/barcode and add to cart */
  private scanBarcode(barcode: string): void {
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) {
      this.errorMessage.set('No active session (kioskUuid). Start a shift first.');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    this.loading.set(true);

    this.itemService.addByBarcode(kioskUuid, barcode).subscribe({
      next: (item) => {
        this.loading.set(false);
        if (item) {
          this.cartService.addItem(item);
          this.emitDisplayUpdate();
        } else {
          this.errorMessage.set('Item not found');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Scan failed');
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
    if(key === 'ENTER') {
      this.searchByKeypad();
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

  /** Open the Void Item modal for selected item */
  voidItem(): void {
    const idx = this.cartService.selectedIndex();
    if (idx >= 0) {
      this.voidItemIndex.set(idx);
      this.voidItemQty.set(1);
      this.showVoidItemModal.set(true);
    }

  }

  /** Cancel/close the Void Item modal */
  cancelVoidItem(): void {
    this.showVoidItemModal.set(false);
    this.voidItemQty.set(1);
    this.voidItemIndex.set(-1);
  }

  /** Confirm voiding selected qty of the item */
  confirmVoidItem(): void {
    console.log('Confirm void item', this.voidItemIndex(), this.voidItemQty());
    const idx = this.voidItemIndex();
    const qty = this.voidItemQty();
    if (idx < 0 || qty < 1) return;
    const item = this.cartService.cart()[idx];
    if (!item) return;
    if (qty >= item.qty) {
      this.cartService.removeItem(idx);
    } else {
      this.cartService.setQty(idx, item.qty - qty);
    }
    this.emitDisplayUpdate();
    this.cancelVoidItem();
  }

  voidAll(): void {
    this.cartService.clearCart();
    this.emitDisplayUpdate();
  }

  /** Open the Void Cart confirmation modal */
  voidCart(): void {
    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;
    this.voidVerificationId.set('');
    this.showVoidModal.set(true);
  }

  /** Cancel / close the Void Cart modal */
  cancelVoidCart(): void {
    this.showVoidModal.set(false);
    this.voidVerificationId.set('');
  }

  /** Confirm Void Cart after verification ID is entered */
  confirmVoidCart(): void {
    const pin = this.voidVerificationId().trim();
    if (!pin) return;

    const kioskUuid = this.cartService.kioskUuid();
    if (!kioskUuid) return;

  //  this.showVoidModal.set(false);
    this.loading.set(true);
    this.cartService.voidCartSession(kioskUuid, pin).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.voidVerificationId.set('');
        if (res.success) {
          this.emitDisplayUpdate();
          history.back();
        } else {
          this.errorMessage.set(res.message || 'Failed to void cart');
          setTimeout(() => this.errorMessage.set(''), 3000);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.voidVerificationId.set('');
        this.errorMessage.set(err?.error?.message || 'Invalid PIN or void failed');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
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
