import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ItemsAdminService } from '../../../core/services/items-admin.service';
import { ItemAdminListItem, ItemAdminListResponse } from '../data/item-admin.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-items-list',
  standalone: true,
  imports: [CommonModule, HeaderComponent, CurrencyIdrPipe],
  templateUrl: './items-list.component.html',
  styleUrl: './items-list.component.css',
})
export class ItemsListComponent implements OnInit {
  readonly searchTerm = signal('');
  readonly hasSearched = signal(false);
  readonly filteredItems = signal<ItemAdminListItem[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly totalItems = signal(0);
  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalPages = signal(0);
  readonly deletingIds = signal<Set<string>>(new Set());
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

    this.route.queryParamMap.subscribe((params) => {
      const query = (params.get('q') ?? '').trim();
      const page = parseInt(params.get('page') ?? '1', 10);
      this.searchTerm.set(query);
      this.currentPage.set(page);
      this.hasSearched.set(query.length > 0);
      this.loadItems(query, page);
    });
  }

  submitSearch(): void {
    const query = this.searchTerm().trim();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null, page: null },
           queryParamsHandling: 'merge', // Merge with existing query params
            replaceUrl: true, // Replace the current history entry
    });
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null, page: null },
           queryParamsHandling: 'merge', // Merge with existing query params
            replaceUrl: true, // Replace the current history entry
    });
  }

  openCreate(): void {
    this.router.navigate(['/items/new'], { queryParams: this.buildQueryParams() });
  }

  openDetail(item: ItemAdminListItem): void {
    this.router.navigate(['/items', item.id], { queryParams: this.buildQueryParams() });
  }

  openEdit(item: ItemAdminListItem): void {
    this.router.navigate(['/items', item.id, 'edit'], { queryParams: this.buildQueryParams() });
  }

  deleteItem(item: ItemAdminListItem): void {
    const confirmed = window.confirm(`Delete item ${item.description}? This will soft delete the real item data.`);
    if (!confirmed) {
      return;
    }

    const deletingIds = this.deletingIds();
    deletingIds.add(item.id);
    this.deletingIds.set(new Set(deletingIds));

    this.itemsAdminService.delete(item.id).subscribe({
      next: () => {
        this.toastService.success(`Item "${item.description}" deleted successfully`);
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id);
        this.deletingIds.set(new Set(deletingIds));
        this.loadItems(this.searchTerm().trim(), this.currentPage());
      },
      error: (err) => {
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id);
        this.deletingIds.set(new Set(deletingIds));
        this.toastService.error(err?.error?.message || 'Failed to delete item');
      },
    });
  }

  goToPage(page: number): void {
    const query = this.searchTerm().trim();
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query || null, page: page > 1 ? page : null },
    });
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  isDeleting(itemId: string): boolean {
    return this.deletingIds().has(itemId);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value || '');
  }

  getStatusClass(status: number): string {
    return status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  }

  getPageNumbers(): number[] {
    const maxPages = 5;
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();

    if (totalPages <= maxPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push(-1); // Ellipsis marker
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - 2) {
      pages.push(-2); // Ellipsis marker
    }

    pages.push(totalPages);

    return pages.filter((p) => p > 0);
  }

  private buildQueryParams(): Params {
    const query = this.searchTerm().trim();
    const page = this.currentPage();
    const params: Params = {};
    if (query) params['q'] = query;
    if (page > 1) params['page'] = page;
    return params;
  }

  private loadItems(query: string, page: number = 1): void {
    this.filteredItems.set([]);
    this.totalItems.set(0);
    this.totalPages.set(0);
    this.errorMessage.set('');

    if (!query) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.itemsAdminService.list(query, page, this.pageSize()).subscribe({
      next: (res: ApiResponse<ItemAdminListResponse>) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.filteredItems.set(res.data.items ?? []);
          this.totalItems.set(res.data.total ?? 0);
          this.totalPages.set(Math.ceil((res.data.total ?? 0) / this.pageSize()));
          return;
        }

        this.filteredItems.set([]);
        this.totalItems.set(0);
        this.totalPages.set(0);
      },
      error: (err) => {
        this.loading.set(false);
        this.filteredItems.set([]);
        this.totalItems.set(0);
        this.totalPages.set(0);
        this.errorMessage.set(err?.error?.message || 'Failed to load items');
      },
    });
  }
}