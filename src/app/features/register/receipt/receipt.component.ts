import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { environment } from '../../../../environments/environment';
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

  constructor(
    private router: Router,
    private authService: AuthService,
    public cartService: CartService,
  ) {}

  ngOnInit(): void {
    // If no receipt data, redirect back
    /*if (!this.cartService.lastTransaction()) {
      this.router.navigate(['/cart']);
      return;
    }*/
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'Cashier';
  }

  printReceipt(): void {
    // Future: connect to printer service
    window.print();
  }

  newTransaction(): void {
    this.cartService.clearReceipt();
    this.router.navigate(['/cart']);
  }
}
