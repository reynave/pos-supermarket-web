import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { PromotionAdminService } from '../../../core/services/promotion-admin.service';
import { Promotion, PromotionListResponse } from '../data/promotion.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './promotion-list.component.html',
  styleUrl: './promotion-list.component.css',
})
export class PromotionListComponent implements OnInit {
  readonly searchTerm = signal('');
  readonly hasSearched = signal(false);
  readonly filteredPromotions = signal<Promotion[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly totalPromotions = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalPages = signal(0);
  readonly deletingIds = signal<Set<string>>(new Set());
  userName = 'User';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly promotionAdminService: PromotionAdminService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';

    this.route.queryParamMap.subscribe(params => {
      const query = (params.get('q') ?? '').trim();
      const page = parseInt(params.get('page') ?? '1', 10);
      this.searchTerm.set(query);
      this.currentPage.set(page);
      this.hasSearched.set(query.length > 0);
      this.loadPromotions(query, page);
    });
  }

  submitSearch(): void {
    const query = this.searchTerm().trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, page: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openCreate(): void {
    this.router.navigate(['/promotions/new'], { queryParams: this.buildQueryParams() });
  }

  openDetail(promo: Promotion): void {
    const promotionId = this.getPromotionId(promo);
    if (!promotionId) {
      this.toastService.error('Promotion ID is missing. Reload the list and try again.');
      return;
    }

    this.router.navigate(['/promotions', promotionId], { queryParams: this.buildQueryParams() });
  }

  deletePromotion(promo: Promotion): void {
    const promotionId = this.getPromotionId(promo);
    if (!promotionId) {
      this.toastService.error('Promotion ID is missing. This row cannot be deleted.');
      return;
    }

    const confirmed = window.confirm(`Delete promotion "${promo.description}"?`);
    if (!confirmed) {
      return;
    }

    const deletingIds = this.deletingIds();
    deletingIds.add(promotionId);
    this.deletingIds.set(new Set(deletingIds));

    this.promotionAdminService.deletePromotion(promotionId).subscribe({
      next: () => {
        this.toastService.success(`Promotion "${promo.description}" deleted successfully`);
        const deletingIds = this.deletingIds();
        deletingIds.delete(promotionId);
        this.deletingIds.set(new Set(deletingIds));
        this.loadPromotions(this.searchTerm(), this.currentPage());
      },
      error: err => {
        const deletingIds = this.deletingIds();
        deletingIds.delete(promotionId);
        this.deletingIds.set(new Set(deletingIds));
        const msg = err.error?.message || err.message || 'Failed to delete promotion';
        this.toastService.error(msg);
      },
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: this.currentPage() - 1 },
        queryParamsHandling: 'merge',
      });
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: this.currentPage() + 1 },
        queryParamsHandling: 'merge',
      });
    }
  }

  loadPromotions(query: string, page: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.promotionAdminService.listPromotions(query, page, this.pageSize()).subscribe({
      next: response => {
        if (response.success) {
          const data = response.data as PromotionListResponse;
          const promotions = Array.isArray(data?.promotions)
            ? data.promotions
                .map((promotion) => this.normalizePromotion(promotion))
                .filter((promotion): promotion is Promotion => Boolean(promotion))
            : [];

          this.filteredPromotions.set(promotions);
          this.totalPromotions.set(Number(data?.total ?? promotions.length));
          this.totalPages.set(Number(data?.totalPages ?? 0));
        } else {
          this.errorMessage.set(response.message || 'Failed to load promotions');
        }
        this.loading.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error loading promotions';
        this.errorMessage.set(msg);
        this.loading.set(false);
      },
    });
  }

  private buildQueryParams(): Record<string, string> {
    const params: Record<string, string> = {};
    if (this.searchTerm().trim()) {
      params['q'] = this.searchTerm().trim();
    }
    if (this.currentPage() > 1) {
      params['page'] = String(this.currentPage());
    }
    return params;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      promotion_free: 'Buy X Get Y Free',
      promotion_item: 'Tiered Pricing',
      promotion_discount: 'Discount',
      voucher: 'Voucher',
    };
    return labels[type] || type;
  }

  isActive(promo: Promotion): boolean {
    return promo.status === 1 && promo.presence === 1;
  }

  getTypeClass(type: string): string {
    if (type === 'promotion_free') {
      return 'bg-blue-100 text-blue-700';
    }

    if (type === 'promotion_item') {
      return 'bg-violet-100 text-violet-700';
    }

    if (type === 'promotion_discount') {
      return 'bg-amber-100 text-amber-700';
    }

    if (type === 'voucher') {
      return 'bg-emerald-100 text-emerald-700';
    }

    return 'bg-slate-100 text-slate-700';
  }

  getStatusClass(promo: Promotion): string {
    return this.isActive(promo)
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-slate-100 text-slate-700';
  }

  private getPromotionId(promo: Partial<Promotion> | null | undefined): string | null {
    if (!promo || typeof promo.id !== 'string') {
      return null;
    }

    const id = promo.id.trim();
    return id.length > 0 ? id : null;
  }

  private normalizePromotion(promo: Promotion | null | undefined): Promotion | null {
    if (!promo) {
      return null;
    }

    const promotionId = this.getPromotionId(promo);
    if (!promotionId) {
      return null;
    }

    return {
      ...promo,
      id: promotionId,
    };
  }
}
