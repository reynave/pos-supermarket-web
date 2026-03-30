import { Injectable, signal, computed } from '@angular/core';
import { Item, CartItem } from '../models/item.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  cart = signal<CartItem[]>([]);
  selectedIndex = signal(-1);

  // Payment result — set after payment completes, consumed by receipt
  lastTransaction = signal<Transaction | null>(null);
  lastCartItems = signal<CartItem[]>([]);
  lastPaymentMethod = signal('');

  subtotal = computed(() => this.cart().reduce((sum, item) => sum + item.price * item.qty, 0));
  taxTotal = computed(() => this.cart().reduce((sum, item) => sum + item.tax, 0));
  grandTotal = computed(() => this.subtotal() + this.taxTotal());
  itemCount = computed(() => this.cart().reduce((sum, item) => sum + item.qty, 0));

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
