import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

interface PaymentTypeDetail {
  id: string;
  openCashDrawer: number;
  label: string;
  name: string;
  com: string;
  ip: string;
  port: string;
  apikey: string;
  mId: string;
  nmId: string;
  merchant: string;
  timeout: number;
  image: string;
  apiUrl: string;
  apiUrlStatus: string;
  edc: number;
  isLock: number;
  status: number;
  presence: number;
  inputBy: string;
  inputDate: string;
  updateBy: string;
  updateDate: string;
  connectionType: string;
}

@Component({
  selector: 'app-payment-type-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-type-detail.component.html',
  styleUrl: './payment-type-detail.component.css',
})
export class PaymentTypeDetailComponent implements OnInit {
  id = signal('');
  loading = signal(false);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  form = signal<PaymentTypeDetail>({
    id: '',
    openCashDrawer: 0,
    label: '',
    name: '',
    com: '',
    ip: '',
    port: '',
    apikey: '',
    mId: '',
    nmId: '',
    merchant: '',
    timeout: 0,
    image: '',
    apiUrl: '',
    apiUrlStatus: '',
    edc: 0,
    isLock: 1,
    status: 1,
    presence: 1,
    inputBy: '',
    inputDate: '',
    updateBy: '',
    updateDate: '',
    connectionType: '',
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (!id) {
      this.errorMessage.set('Payment type id is missing');
      return;
    }

    this.id.set(id);
    this.loadDetail(id);
  }

  private loadDetail(id: string): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<ApiResponse<PaymentTypeDetail>>(`${environment.apiUrl}/payment/types/${encodeURIComponent(id)}`).subscribe({
      next: (res: ApiResponse<PaymentTypeDetail>) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.form.set({
            ...res.data,
            connectionType: String(res.data.connectionType || '').toUpperCase(),
          });
          return;
        }

        this.errorMessage.set('Payment type detail not found');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to load payment type detail');
      },
    });
  }

  save(): void {
    const current = this.form();
    this.successMessage.set('');
    this.errorMessage.set('');

    if (!current.label.trim()) {
      this.errorMessage.set('Label is required');
      return;
    }
    if (!current.name.trim()) {
      this.errorMessage.set('Name is required');
      return;
    }

    const normalizedConnectionType = String(current.connectionType || '').trim().toUpperCase();
    const payload = {
      openCashDrawer: Number(current.openCashDrawer || 0),
      label: current.label.trim(),
      name: current.name.trim(),
      com: String(current.com || '').trim(),
      ip: String(current.ip || '').trim(),
      port: String(current.port || '').trim(),
      apikey: String(current.apikey || '').trim(),
      mId: String(current.mId || '').trim(),
      nmId: String(current.nmId || '').trim(),
      merchant: String(current.merchant || '').trim(),
      timeout: Number(current.timeout || 0),
      image: String(current.image || '').trim(),
      apiUrl: String(current.apiUrl || '').trim(),
      apiUrlStatus: String(current.apiUrlStatus || '').trim(),
      edc: Number(current.edc || 0),
      isLock: Number(current.isLock || 0),
      status: Number(current.status || 0),
      presence: Number(current.presence || 0),
      inputBy: String(current.inputBy || '').trim(),
      updateBy: String(current.updateBy || '').trim(),
      connectionType: normalizedConnectionType,
    };

    this.saving.set(true);
    this.http.put<ApiResponse<PaymentTypeDetail>>(`${environment.apiUrl}/payment/types/${encodeURIComponent(this.id())}`, payload).subscribe({
      next: (res: ApiResponse<PaymentTypeDetail>) => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.form.set({
            ...res.data,
            connectionType: String(res.data.connectionType || '').toUpperCase(),
          });
          this.successMessage.set('Payment type updated successfully');
          return;
        }

        this.errorMessage.set(res.message || 'Failed to update payment type');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to update payment type');
      },
    });
  }

  setConnectionType(value: string): void {
    this.form.update((current) => ({
      ...current,
      connectionType: value,
    }));
  }

  onLabelChange(value: string): void {
    this.form.update((current) => ({ ...current, label: value }));
  }

  onNameChange(value: string): void {
    this.form.update((current) => ({ ...current, name: value }));
  }

  onImageChange(value: string): void {
    this.form.update((current) => ({ ...current, image: value }));
  }

  onEdcChange(value: number): void {
    this.form.update((current) => ({ ...current, edc: Number(value || 0) }));
  }

  onOpenCashDrawerChange(value: number): void {
    this.form.update((current) => ({ ...current, openCashDrawer: Number(value || 0) }));
  }

  onPresenceChange(value: number): void {
    this.form.update((current) => ({ ...current, presence: Number(value || 0) }));
  }

  onTimeoutChange(value: number): void {
    this.form.update((current) => ({ ...current, timeout: Number(value || 0) }));
  }

  onComChange(value: string): void {
    this.form.update((current) => ({ ...current, com: value }));
  }

  onIpChange(value: string): void {
    this.form.update((current) => ({ ...current, ip: value }));
  }

  onPortChange(value: string): void {
    this.form.update((current) => ({ ...current, port: value }));
  }

  onApiKeyChange(value: string): void {
    this.form.update((current) => ({ ...current, apikey: value }));
  }

  onMidChange(value: string): void {
    this.form.update((current) => ({ ...current, mId: value }));
  }

  onNmidChange(value: string): void {
    this.form.update((current) => ({ ...current, nmId: value }));
  }

  onMerchantChange(value: string): void {
    this.form.update((current) => ({ ...current, merchant: value }));
  }

  onApiUrlChange(value: string): void {
    this.form.update((current) => ({ ...current, apiUrl: value }));
  }

  onApiUrlStatusChange(value: string): void {
    this.form.update((current) => ({ ...current, apiUrlStatus: value }));
  }

  onInputByChange(value: string): void {
    this.form.update((current) => ({ ...current, inputBy: value }));
  }

  onUpdateByChange(value: string): void {
    this.form.update((current) => ({ ...current, updateBy: value }));
  }

  onIsLockChange(value: number): void {
    this.form.update((current) => ({ ...current, isLock: Number(value || 0) }));
  }

  onStatusChange(value: number): void {
    this.form.update((current) => ({ ...current, status: Number(value || 0) }));
  }

  goBack(): void {
    history.back();
  }
}
