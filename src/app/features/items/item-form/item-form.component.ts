import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CurrencyIdrPipe } from '../../../shared/pipes/currency-idr.pipe';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ItemsAdminService } from '../../../core/services/items-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  createEmptyItemForm,
  ItemAdminDetail,
  ItemCategoryOption,
  ItemFormValue,
  ItemsAdminMeta,
  ItemTaxOption,
  ItemUomOption,
} from '../data/item-admin.model';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyIdrPipe],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.css',
})
export class ItemFormComponent implements OnInit {
  readonly form = signal<ItemFormValue>(createEmptyItemForm());
  readonly mode = signal<'create' | 'edit'>('create');
  readonly returnQuery = signal('');
  readonly errorMessage = signal('');
  readonly loading = signal(false);
  readonly metaLoading = signal(false);
  readonly saveLoading = signal(false);
  readonly categories = signal<ItemCategoryOption[]>([]);
  readonly uoms = signal<ItemUomOption[]>([]);
  readonly taxes = signal<ItemTaxOption[]>([]);
  readonly previewName = computed(() => this.form().description.trim() || 'Item Preview');
  readonly previewCode = computed(() => this.form().id.trim().toUpperCase() || 'ITEM-ID');
  readonly previewStatusClass = computed(() => {
    return this.form().status === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  });
  private editingId = '';
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
    this.loadMeta();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.mode.set('edit');
    this.editingId = id;
    this.loadDetail(id);
  }

  updateField<K extends keyof ItemFormValue>(key: K, value: ItemFormValue[K]): void {
    this.form.update((current) => ({
      ...current,
      [key]: value,
    }));
  }

  save(): void {
    this.errorMessage.set('');

    try {
      this.validateForm(this.form());
      this.saveLoading.set(true);

      if (this.mode() === 'create') {
        this.itemsAdminService.create(this.form()).subscribe({
          next: (res: ApiResponse<ItemAdminDetail>) => {
            this.saveLoading.set(false);
            if (res.success && res.data) {
              this.toastService.success(`Item "${res.data.description}" created successfully`);
             history.back();
              // this.router.navigate(['/items', res.data.id], { queryParams: this.buildQueryParams() });
              return;
            }

            this.errorMessage.set('Failed to create item');
          },
          error: (err) => {
            this.saveLoading.set(false);
            const errorMsg = err?.error?.message || 'Failed to create item';
            this.errorMessage.set(errorMsg);
            this.toastService.error(errorMsg);
          },
        });
        return;
      }

      this.itemsAdminService.update(this.editingId, this.form()).subscribe({
        next: (res: ApiResponse<ItemAdminDetail>) => {
          this.saveLoading.set(false);
          if (res.success && res.data) {
            this.toastService.success(`Item "${res.data.description}" updated successfully`);
            history.back();
            //this.router.navigate(['/items', res.data.id], { queryParams: this.buildQueryParams() });
            return;
          }

          this.errorMessage.set('Failed to update item');
        },
        error: (err) => {
          this.saveLoading.set(false);
          const errorMsg = err?.error?.message || 'Failed to update item';
          this.errorMessage.set(errorMsg);
          this.toastService.error(errorMsg);
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save item';
      this.errorMessage.set(errorMsg);
      this.toastService.error(errorMsg);
    }
  }

  cancel(): void {
    // if (this.mode() === 'edit' && this.editingId) {
    //      history.back();
    //  // this.router.navigate(['/items', this.editingId], { queryParams: this.buildQueryParams() });
    //   return;
    // }

     history.back();
    // this.router.navigate(['/items'], { queryParams: this.buildQueryParams() });
  }

  addBarcodeField(): void {
    this.form.update((current) => ({
      ...current,
      barcodes: [...current.barcodes, ''],
    }));
  }

  removeBarcodeField(index: number): void {
    this.form.update((current) => {
      const nextBarcodes = current.barcodes.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...current,
        barcodes: nextBarcodes.length > 0 ? nextBarcodes : [''],
      };
    });
  }

  updateBarcode(index: number, value: string): void {
    this.form.update((current) => ({
      ...current,
      barcodes: current.barcodes.map((barcode, currentIndex) => (currentIndex === index ? value : barcode)),
    }));
  }

  getSelectedCategoryLabel(): string {
    return this.categories().find((category) => category.id === this.form().itemCategoryId)?.name || 'Category';
  }

  getSelectedUomLabel(): string {
    const selected = this.uoms().find((uom) => uom.id === this.form().itemUomId);
    return selected?.name || selected?.id || 'UOM';
  }

  private loadMeta(): void {
    this.metaLoading.set(true);
    this.itemsAdminService.getMeta().subscribe({
      next: (res: ApiResponse<ItemsAdminMeta>) => {
        this.metaLoading.set(false);
        if (res.success && res.data) {
          this.categories.set(res.data.categories ?? []);
          this.uoms.set(res.data.uoms ?? []);
          this.taxes.set(res.data.taxes ?? []);

          const current = this.form();
          if (!current.itemUomId && res.data.uoms[0]) {
            this.updateField('itemUomId', res.data.uoms[0].id);
          }
          if (!current.itemCategoryId && res.data.categories[0]) {
            this.updateField('itemCategoryId', res.data.categories[0].id);
          }
          if (!current.itemTaxId && res.data.taxes[0]) {
            this.updateField('itemTaxId', res.data.taxes[0].id);
          }
          return;
        }

        this.errorMessage.set('Failed to load item metadata');
      },
      error: (err) => {
        this.metaLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to load item metadata');
      },
    });
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.itemsAdminService.getById(id).subscribe({
      next: (res: ApiResponse<ItemAdminDetail>) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.form.set(this.toFormValue(res.data));
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

  private validateForm(form: ItemFormValue): void {
    if (!form.id.trim() && this.mode() === 'create') {
      throw new Error('Item ID is required');
    }
    if (!form.barcodes.some((barcode) => barcode.trim().length > 0)) {
      throw new Error('At least one barcode is required');
    }
    if (!form.description.trim()) {
      throw new Error('Item name is required');
    }
    if (!form.itemCategoryId.trim()) {
      throw new Error('Category is required');
    }
    if (!form.itemUomId.trim()) {
      throw new Error('UOM is required');
    }
    if (Number(form.price1) < 0) {
      throw new Error('Price must be zero or greater');
    }
    const normalized = form.barcodes
      .map((barcode) => barcode.trim().toLowerCase())
      .filter((barcode) => barcode.length > 0);
    if (new Set(normalized).size !== normalized.length) {
      throw new Error('Barcode must be unique');
    }
  }

  private toFormValue(item: ItemAdminDetail): ItemFormValue {
    return {
      id: item.id,
      description: item.description,
      shortDesc: item.shortDesc,
      price1: item.price1,
      itemUomId: item.itemUomId,
      itemCategoryId: item.itemCategoryId,
      itemTaxId: item.itemTaxId,
      images: item.images,
      status: item.status,
      barcodes: item.barcodes.length > 0 ? item.barcodes.map((barcode) => barcode.barcode) : [''],
    };
  }

  private buildQueryParams(): Params {
    const query = this.returnQuery();
    return query ? { q: query } : {};
  }
}