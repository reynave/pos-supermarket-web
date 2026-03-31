import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Item, CartItem } from '../models/item.model';
import { Transaction } from '../models/transaction.model';

/** Shape returned by POST /api/cart/new */
interface KioskUuidRecord {
  kioskUuid: string;
  cashierId: string;
  terminalId: string;
  storeOutlesId: string | null;
  status: number;
  presence: number;
  inputDate: number;
  input_date: string;
  update_date: string;
}

/** Shape returned by GET /api/cart/list/:kioskUuid */
interface CartListItem {
  itemId: string;
  name: string;
  barcode: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  uom: string;
  imageUrl: string | null;
}

export interface CartListResponse {
  kioskUuid: string;
  session: KioskUuidRecord;
  items: CartListItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  grandTotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly KIOSK_KEY = 'pos_kiosk_uuid';

  cart = signal<CartItem[]>([]);
  selectedIndex = signal(-1);
  kioskUuid = signal(this.loadKioskUuid());

  // Payment result — set after payment completes, consumed by receipt
  lastTransaction = signal<Transaction | null>(null);
  lastCartItems = signal<CartItem[]>([]);
  lastPaymentMethod = signal('');

  subtotal = computed(() => this.cart().reduce((sum, item) => sum + item.price * item.qty, 0));
  taxTotal = computed(() => this.cart().reduce((sum, item) => sum + item.tax, 0));
  grandTotal = computed(() => this.subtotal() + this.taxTotal());
  itemCount = computed(() => this.cart().reduce((sum, item) => sum + item.qty, 0));

  constructor(private http: HttpClient) {}

  /** POST /api/cart/new — create new cart session on backend, save kioskUuid to localStorage */
  createNewCart(cashierId: string, terminalId: string, storeOutletId?: string): Observable<ApiResponse<KioskUuidRecord>> {
    const body: Record<string, string> = { cashierId, terminalId };
    if (storeOutletId) body['storeOutletId'] = storeOutletId;

    return this.http.post<ApiResponse<KioskUuidRecord>>(`${environment.apiUrl}/cart/new`, body).pipe(
      tap((res) => {
        if (res.success && res.data) {
          this.setKioskUuid(res.data.kioskUuid);
        }
      }),
    );
  }


  
  /** Save kioskUuid to signal + localStorage */
  setKioskUuid(uuid: string): void {
    localStorage.setItem(this.KIOSK_KEY, uuid);
    this.kioskUuid.set(uuid);
  }

  /** Clear kioskUuid from signal + localStorage (called after payment complete) */
  clearKioskUuid(): void {
    localStorage.removeItem(this.KIOSK_KEY);
    this.kioskUuid.set('');
  }

  /**
   * POST /api/cart/void/:kioskUuid — verify PIN + hard delete all cart data on backend,
   * then clear local cart state + kioskUuid from localStorage.
   */
  voidCartSession(kioskUuid: string, pin: string): Observable<ApiResponse<{ kioskUuid: string; authorizedBy: string }>> {
    return this.http
      .post<ApiResponse<{ kioskUuid: string; authorizedBy: string }>>(`${environment.apiUrl}/cart/void/${kioskUuid}`, { pin })
      .pipe(
        tap((res) => {
          if (res.success) {
            this.clearCart();
            this.clearKioskUuid();
          }
        }),
      );
  }

  /** Load kioskUuid from localStorage on service init */
  private loadKioskUuid(): string {
    return localStorage.getItem(this.KIOSK_KEY) ?? '';
  }

  /**
   * GET /api/cart/list/:kioskUuid — load cart items from backend.
   * Restores cart state (items array) into the signal, returns the full response.
   */
  loadCart(kioskUuid: string): Observable<CartListResponse | null> {
    return this.http
      .get<ApiResponse<CartListResponse>>(`${environment.apiUrl}/cart/list/${kioskUuid}`)
      .pipe(
        map((res) => {
          if (res.success && res.data) {
            // Restore cart items into signal
            const cartItems: CartItem[] = res.data.items.map((i) => ({
              id: crypto.randomUUID(),
              itemId: i.itemId,
              name: i.name,
              barcode: i.barcode,
              qty: i.qty,
              price: i.price,
              discount: i.discount,
              tax: i.tax,
              total: i.total,
              uom: i.uom,
            }));
            this.cart.set(cartItems);
            this.selectedIndex.set(-1);
            return res.data;
          }
          return null;
        }),
        catchError(() => of(null)),
      );
  }

  addItem(item: Item): void {
    const currentCart = [...this.cart()];
    const existing = currentCart.findIndex((c) => c.itemId === item.id);
    if (existing >= 0) {
      currentCart[existing] = {
        ...currentCart[existing],
        qty: currentCart[existing].qty + 1,
        tax: (currentCart[existing].qty + 1) * currentCart[existing].price * (item.taxPercent / 100),
        total: (currentCart[existing].qty + 1) * currentCart[existing].price,
      };
      this.selectedIndex.set(existing);
    } else {
      const taxAmount = item.price * (item.taxPercent / 100);
      const cartItem: CartItem = {
        id: crypto.randomUUID(),
        itemId: item.id,
        name: item.name,
        barcode: item.barcode,
        qty: 1,
        price: item.price,
        discount: 0,
        tax: taxAmount,
        total: item.price,
        uom: item.uom,
      };
      currentCart.push(cartItem);
      this.selectedIndex.set(currentCart.length - 1);
    }
    this.cart.set(currentCart);
  }

  removeItem(index: number): void {
    const currentCart = [...this.cart()];
    currentCart.splice(index, 1);
    this.cart.set(currentCart);
    this.selectedIndex.set(-1);
  }

  setQty(index: number, qty: number): void {
    if (index < 0 || !qty || qty < 1) return;
    const currentCart = [...this.cart()];
    const item = currentCart[index];
    currentCart[index] = { ...item, qty, total: qty * item.price, tax: qty * item.price * 0.1 };
    this.cart.set(currentCart);
  }

  clearCart(): void {
    this.cart.set([]);
    this.selectedIndex.set(-1);
  }

  /** Save cart snapshot before clearing, so receipt can display it */
  saveForReceipt(transaction: Transaction, paymentMethod: string): void {
    this.lastTransaction.set(transaction);
    this.lastCartItems.set([...this.cart()]);
    this.lastPaymentMethod.set(paymentMethod);
    this.clearCart();
  }

  clearReceipt(): void {
    this.lastTransaction.set(null);
    this.lastCartItems.set([]);
    this.lastPaymentMethod.set('');
  }
}
