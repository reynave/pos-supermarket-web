import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { PromotionAdminService } from '../../../core/services/promotion-admin.service';
import { Promotion } from '../data/promotion.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-promotion-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './promotion-form.component.html',
  styleUrl: './promotion-form.component.css',
})
export class PromotionFormComponent implements OnInit {
  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly promotion = signal<Partial<Promotion>>({
    typeOfPromotion: 'promotion_free',
    Mon: 1,
    Tue: 1,
    Wed: 1,
    Thu: 1,
    Fri: 1,
    Sat: 1,
    Sun: 1,
  });
  readonly errorMessage = signal('');
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

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.loadPromotion(id);
    }
  }

  loadPromotion(id: string): void {
    this.loading.set(true);
    this.promotionAdminService.getPromotionById(id).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.promotion.set(response.data);
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

  submit(): void {
    const promo = this.promotion();

    if (!promo.description || !promo.typeOfPromotion || !promo.startDate || !promo.endDate) {
      this.toastService.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const submitFn = this.isEdit()
      ? this.promotionAdminService.updatePromotion(promo.id!, promo)
      : this.promotionAdminService.createPromotion(promo);

    submitFn.subscribe({
      next: response => {
        if (response.success && response.data) {
          const msg = this.isEdit() ? 'Promotion updated successfully' : 'Promotion created successfully';
          this.toastService.success(msg);

          if (!this.isEdit()) {
            // Redirect to detail page to manage detail rows
            this.router.navigate(['/promotions', response.data.id]);
          } else {
            this.router.navigate(['/promotions']);
          }
        } else {
          this.errorMessage.set(response.message || 'Failed to save promotion');
        }
        this.saving.set(false);
      },
      error: err => {
        const msg = err.error?.message || err.message || 'Error saving promotion';
        this.errorMessage.set(msg);
        this.saving.set(false);
      },
    });
  }

  goBack(): void {
    history.back();
  }

  toggleDay(day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'): void {
    const promo = this.promotion();
    promo[day] = promo[day] === 1 ? 0 : 1;
    this.promotion.set({ ...promo });
  }

  isDaySelected(day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'): boolean {
    return this.promotion()[day] === 1;
  }
}
