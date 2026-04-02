import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import {
  DailyCloseHistoryItem,
  DailyCloseHistoryResponse,
  DailyCloseService,
} from '../../../core/services/daily-close.service';
import { ApiResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-daily-close-history',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './daily-close-history.component.html',
  styleUrl: './daily-close-history.component.css',
})
export class DailyCloseHistoryComponent implements OnInit {
  loading = signal(false);
  historyItems = signal<DailyCloseHistoryItem[]>([]);
  totalItems = signal(0);

  constructor(private dailyCloseService: DailyCloseService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  goBack(): void {
    history.back();
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.dailyCloseService.getHistory().subscribe({
      next: (res: ApiResponse<DailyCloseHistoryResponse>) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.historyItems.set(res.data.items || []);
          this.totalItems.set(Number(res.data.total || res.data.items?.length || 0));
        }
      },
      error: () => this.loading.set(false),
    });
  }
}
