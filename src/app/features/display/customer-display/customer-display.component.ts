import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../../core/services/socket.service';
import { CartItem } from '../../../core/models/item.model';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { environment } from '../../../../environments/environment';

interface DisplayData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

@Component({
  selector: 'app-customer-display',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './customer-display.component.html',
  styleUrl: './customer-display.component.css',
})
export class CustomerDisplayComponent implements OnInit, OnDestroy {
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  items = signal<CartItem[]>([]);
  subtotal = signal(0);
  tax = signal(0);
  grandTotal = signal(0);
  currentTime = signal('');
  terminalId = environment.terminalId;

  savings = computed(() => this.items().reduce((sum, item) => sum + item.discount, 0));

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    this.socketService.connect();
    this.socketService.on('display:update', (data: unknown) => {
      const d = data as DisplayData;
      this.items.set(d.items ?? []);
      this.subtotal.set(d.subtotal ?? 0);
      this.tax.set(d.tax ?? 0);
      this.grandTotal.set(d.total ?? 0);
    });
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
}
