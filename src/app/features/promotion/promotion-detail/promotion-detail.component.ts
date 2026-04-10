import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { AuthService } from '../../../core/services/auth.service';
import { PromotionAdminService } from '../../../core/services/promotion-admin.service';
import { Promotion } from '../data/promotion.model';
import { ToastService } from '../../../core/services/toast.service';
import { PromotionFreeDetailComponent } from '../promotion-free-detail/promotion-free-detail.component';
import { PromotionItemDetailComponent } from '../promotion-item-detail/promotion-item-detail.component';

@Component({
  selector: 'app-promotion-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    PromotionFreeDetailComponent,
    PromotionItemDetailComponent,
  ],
  templateUrl: './promotion-detail.component.html',
  styleUrl: './promotion-detail.component.css',
})
export class PromotionDetailComponent implements OnInit {
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isEditing = signal(false);
  readonly errorMessage = signal('');
  readonly promotion = signal<Partial<Promotion> | null>(null);
  readonly promotionId = signal('');
  userName = 'User';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly promotionAdminService: PromotionAdminService,
    private readonly toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.userName = user?.name ?? 'User';

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Promotion ID is missing');
      return;
    }

    this.promotionId.set(id);
    this.loadPromotion();
  }

  loadPromotion(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.promotionAdminService.getPromotionById(this.promotionId()).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.promotion.set(this.normalizeForForm(response.data));
        } else {
          this.errorMessage.set(response.message || 'Failed to load promotion');
        }
        this.loading.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error loading promotion';
        this.errorMessage.set(msg);
        this.loading.set(false);
      },
    });
  }

  enableEdit(): void {
    this.isEditing.set(true);
  }

  cancelEdit(): void {
    this.isEditing.set(false);
    this.loadPromotion();
  }

  saveUpdate(): void {
    const promo = this.promotion();
    if (!promo?.id || !promo.description || !promo.typeOfPromotion || !promo.startDate || !promo.endDate) {
      this.toastService.error('Please complete required fields before saving');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    this.promotionAdminService.updatePromotion(promo.id, promo).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.toastService.success('Promotion updated successfully');
          this.promotion.set(this.normalizeForForm(response.data));
          this.isEditing.set(false);
        } else {
          this.errorMessage.set(response.message || 'Failed to update promotion');
        }
        this.saving.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error updating promotion';
        this.errorMessage.set(msg);
        this.saving.set(false);
      },
    });
  }

  goBack(): void {
    history.back();
  }

  toggleDay(day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'): void {
    if (!this.isEditing()) {
      return;
    }

    const promo = this.promotion();
    if (!promo) {
      return;
    }

    promo[day] = promo[day] === 1 ? 0 : 1;
    this.promotion.set({ ...promo });
  }

  isDaySelected(day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'): boolean {
    const promo = this.promotion();
    return promo?.[day] === 1;
  }

  private normalizeForForm(promotion: Promotion): Partial<Promotion> {
    return {
      ...promotion,
      startDate: this.toDateTimeLocalValue(promotion.startDate),
      endDate: this.toDateTimeLocalValue(promotion.endDate),
    };
  }

  private toDateTimeLocalValue(input?: string): string {
    if (!input) {
      return '';
    }

    const date = new Date(input);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
