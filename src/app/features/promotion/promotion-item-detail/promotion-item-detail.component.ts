import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { PromotionAdminService } from '../../../core/services/promotion-admin.service';
import { PromotionItemService } from '../../../core/services/promotion-item.service';
import { Promotion, PromotionItem } from '../data/promotion.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-promotion-item-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './promotion-item-detail.component.html',
  styleUrl: './promotion-item-detail.component.css',
})
export class PromotionItemDetailComponent implements OnInit {
  @Input() promotionIdInput: string | null = null;
  @Input() embeddedMode = false;

  readonly promotionId = signal('');
  readonly promotion = signal<Promotion | null>(null);
  readonly items = signal<PromotionItem[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formData = signal<Partial<PromotionItem>>({
    qtyFrom: 1,
    qtyTo: 99999,
    specialPrice: 0,
    disc1: 0,
    disc2: 0,
    disc3: 0,
    discountPrice: 0,
  });
  readonly saving = signal(false);
  readonly deletingIds = signal<Set<number>>(new Set());
  userName = 'User';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly promotionAdminService: PromotionAdminService,
    private readonly promotionItemService: PromotionItemService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';

    const id = this.promotionIdInput || this.route.snapshot.paramMap.get('promotionId');
    if (id) {
      this.promotionId.set(id);
      this.loadPromotion();
      this.loadItems();
    }
  }

  loadPromotion(): void {
    this.promotionAdminService.getPromotionById(this.promotionId()).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.promotion.set(response.data);
        }
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error loading promotion';
        this.toastService.error(msg);
      },
    });
  }

  loadItems(): void {
    this.loading.set(true);
    this.promotionItemService.listByPromotionId(this.promotionId()).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.items.set(response.data);
        }
        this.loading.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error loading promotion items';
        this.toastService.error(msg);
        this.loading.set(false);
      },
    });
  }

  openForm(item?: PromotionItem): void {
    if (item) {
      this.editingId.set(item.id!);
      this.formData.set({ ...item });
    } else {
      this.editingId.set(null);
      this.formData.set({
        promotionId: this.promotionId(),
        qtyFrom: 1,
        qtyTo: 99999,
        specialPrice: 0,
        disc1: 0,
        disc2: 0,
        disc3: 0,
        discountPrice: 0,
      });
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.formData.set({});
  }

  submitForm(): void {
    const data = this.formData();

    if (!data.itemId || data.qtyFrom === undefined || data.qtyTo === undefined) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);

    const submitFn = this.editingId()
      ? this.promotionItemService.update(this.editingId()!, data)
      : this.promotionItemService.create(data);

    submitFn.subscribe({
      next: () => {
        const msg = this.editingId() ? 'Promo item updated' : 'Promo item created';
        this.toastService.success(msg);
        this.closeForm();
        this.loadItems();
        this.saving.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error saving promo item';
        this.toastService.error(msg);
        this.saving.set(false);
      },
    });
  }

  deleteItem(item: PromotionItem): void {
    const confirmed = window.confirm('Delete this item pricing tier?');
    if (!confirmed || !item.id) {
      return;
    }

    const deletingIds = this.deletingIds();
    deletingIds.add(item.id);
    this.deletingIds.set(new Set(deletingIds));

    this.promotionItemService.delete(item.id).subscribe({
      next: () => {
        this.toastService.success('Promo item deleted');
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id!);
        this.deletingIds.set(new Set(deletingIds));
        this.loadItems();
      },
      error: err => {
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id!);
        this.deletingIds.set(new Set(deletingIds));
        const msg = err.error?.message || err.message || 'Error deleting promo item';
        this.toastService.error(msg);
      },
    });
  }

  goBack(): void {
    if (this.embeddedMode) {
      return;
    }

    history.back();
  }
}
