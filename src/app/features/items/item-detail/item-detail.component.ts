import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';

import { ItemsAdminService } from '../../../core/services/items-admin.service';
import { ItemAdminDetail } from '../data/item-admin.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [CommonModule, CurrencyIdrPipe],
  templateUrl: './item-detail.component.html',
  styleUrl: './item-detail.component.css',
})
export class ItemDetailComponent implements OnInit {
  readonly item = signal<ItemAdminDetail | null>(null);
  readonly returnQuery = signal('');
  readonly loading = signal(false);
  readonly deleteLoading = signal(false);
  readonly errorMessage = signal('');
  userName = 'User';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly itemsAdminService: ItemsAdminService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';
    this.returnQuery.set((this.route.snapshot.queryParamMap.get('q') ?? '').trim());

    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!id) {
      this.errorMessage.set('Item ID is missing');
      return;
    }

    this.loading.set(true);
    this.itemsAdminService.getById(id).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.item.set(res.data);
          return;
        }

        this.errorMessage.set('Item not found');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to load item detail');
      },
    });
  }

  goToList(): void {
    history.back();
  }

  openEdit(): void {
    const current = this.item();
    if (!current) {
      return;
    } 

    this.router.navigate(['/items', current.id, 'edit'], { queryParams: this.buildQueryParams() });
  }

  deleteItem(): void {
    const current = this.item();
    if (!current) {
      return;
    }

    const confirmed = window.confirm(`Delete item ${current.description}? This will soft delete the real item data.`);
    if (!confirmed) {
      return;
    }

    this.deleteLoading.set(true);
    this.itemsAdminService.delete(current.id).subscribe({
      next: () => {
        this.toastService.success(`Item "${current.description}" deleted successfully`);
        this.deleteLoading.set(false);
        this.goToList();
      },
      error: (err) => {
        this.deleteLoading.set(false);
        this.toastService.error(err?.error?.message || 'Failed to delete item');
      },
    });
  }

  getStatusClass(status: number): string {
    return status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  }

  private buildQueryParams(): Params {
    const query = this.returnQuery();
    return query ? { q: query } : {};
  }
}