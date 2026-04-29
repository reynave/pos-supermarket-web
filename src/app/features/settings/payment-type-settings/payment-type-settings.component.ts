import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface PaymentTypeRow {
  id: string;
  label: string;
  name: string;
  connectionType: string;
  edc: number;
  isLock: number;
  status: number;
  presence: number;
}

@Component({
  selector: 'app-payment-type-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-type-settings.component.html',
  styleUrl: './payment-type-settings.component.css',
})
export class PaymentTypeSettingsComponent implements OnInit {
  paymentTypes = signal<PaymentTypeRow[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  searchTerm = signal('');

  filteredPaymentTypes = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    if (!keyword) return this.paymentTypes();

    return this.paymentTypes().filter((row) => {
      return (
        row.id.toLowerCase().includes(keyword) ||
        String(row.label || '').toLowerCase().includes(keyword) ||
        String(row.name || '').toLowerCase().includes(keyword) ||
        String(row.connectionType || '').toLowerCase().includes(keyword)
      );
    });
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPaymentTypes();
  }

  private loadPaymentTypes(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<any>(`${environment.apiUrl}/payment/types/all`).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && Array.isArray(res.data)) {
          this.paymentTypes.set(res.data);
          return;
        }

        this.paymentTypes.set([]);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Failed to load payment type list. Showing fallback data.');
      
      },
    });
  }

  goBack(): void {
    history.back();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value || '');
  }
}
