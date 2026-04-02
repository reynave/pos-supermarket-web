import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface ManualCashSummaryResponse {
  resetId: string;
  cashierId: string;
  startDate: string;
  openingBalance: number;
  currentCashBalance: number;
  terminalId: string;
}

@Injectable({ providedIn: 'root' })
export class ManualCashService {
  constructor(private http: HttpClient) {}

  getSummary(terminalId: string): Observable<ApiResponse<ManualCashSummaryResponse>> {
    return this.http.get<ApiResponse<ManualCashSummaryResponse>>(
      `${environment.apiUrl}/manual-cash/summary/${terminalId}`,
    );
  }

  addCashIn(payload: { resetId?: string; terminalId: string; amount: number }): Observable<ApiResponse<{ resetId: string; addedAmount: number; currentCashBalance: number }>> {
    return this.http.post<ApiResponse<{ resetId: string; addedAmount: number; currentCashBalance: number }>>(
      `${environment.apiUrl}/manual-cash/add`,
      payload,
    );
  }

  openDrawer(payload: { terminalId: string }): Observable<ApiResponse<{ opened: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ opened: boolean; message: string }>>(
      `${environment.apiUrl}/manual-cash/open-drawer`,
      payload,
    );
  }
}
