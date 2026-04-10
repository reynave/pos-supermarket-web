import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { PromotionAdminService } from '../../../core/services/promotion-admin.service';
import { PromotionFreeService } from '../../../core/services/promotion-free.service';
import { Promotion, PromotionFree } from '../data/promotion.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-promotion-free-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './promotion-free-detail.component.html',
  styleUrl: './promotion-free-detail.component.css',
})
export class PromotionFreeDetailComponent implements OnInit {
  @Input() promotionIdInput: string | null = null;
  @Input() embeddedMode = false;

  readonly promotionId = signal('');
  readonly promotion = signal<Promotion | null>(null);
  readonly freeItems = signal<PromotionFree[]>([]);
  readonly loading = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<number | null>(null);
  readonly formData = signal<Partial<PromotionFree>>({
    applyMultiply: 0,
    scanFree: 0,
    printOnBill: 0,
  });
  readonly saving = signal(false);
  readonly deletingIds = signal<Set<number>>(new Set());
  userName = 'User';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly promotionAdminService: PromotionAdminService,
    private readonly promotionFreeService: PromotionFreeService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';

    const id = this.promotionIdInput || this.route.snapshot.paramMap.get('promotionId');
    if (id) {
      this.promotionId.set(id);
      this.loadPromotion();
      this.loadFreeItems();
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

  loadFreeItems(): void {
    this.loading.set(true);
    this.promotionFreeService.listByPromotionId(this.promotionId()).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.freeItems.set(response.data);
        }
        this.loading.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error loading free items';
        this.toastService.error(msg);
        this.loading.set(false);
      },
    });
  }

  openForm(item?: PromotionFree): void {
    if (item) {
      this.editingId.set(item.id!);
      this.formData.set({ ...item });
    } else {
      this.editingId.set(null);
      this.formData.set({
        promotionId: this.promotionId(),
        applyMultiply: 0,
        scanFree: 0,
        printOnBill: 0,
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

    if (!data.itemId || !data.freeItemId || !data.qty || !data.freeQty) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);

    const submitFn = this.editingId()
      ? this.promotionFreeService.update(this.editingId()!, data)
      : this.promotionFreeService.create(data);

    submitFn.subscribe({
      next: () => {
        const msg = this.editingId() ? 'Free item updated' : 'Free item created';
        this.toastService.success(msg);
        this.closeForm();
        this.loadFreeItems();
        this.saving.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error saving free item';
        this.toastService.error(msg);
        this.saving.set(false);
      },
    });
  }

  deleteItem(item: PromotionFree): void {
    const confirmed = window.confirm('Delete this free item configuration?');
    if (!confirmed || !item.id) {
      return;
    }

    const deletingIds = this.deletingIds();
    deletingIds.add(item.id);
    this.deletingIds.set(new Set(deletingIds));

    this.promotionFreeService.delete(item.id).subscribe({
      next: () => {
        this.toastService.success('Free item deleted');
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id!);
        this.deletingIds.set(new Set(deletingIds));
        this.loadFreeItems();
      },
      error: err => {
        const deletingIds = this.deletingIds();
        deletingIds.delete(item.id!);
        this.deletingIds.set(new Set(deletingIds));
        const msg = err.error?.message || err.message || 'Error deleting free item';
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

  toggleCheckbox(field: 'applyMultiply' | 'scanFree' | 'printOnBill'): void {
    const data = this.formData();
    data[field] = data[field] === 1 ? 0 : 1;
    this.formData.set({ ...data });
  }
}
