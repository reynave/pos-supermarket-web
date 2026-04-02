import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface DailyCloseSummaryResponse {
  reset: {
    id: string;
    startDate: string;
    endDate?: string | null;
    totalTransaction?: number;
    summaryTotalVoid?: number;
    summaryTotalTransaction?: number;
    summaryTotalCart?: number;
    overalitemSales?: number;
    overalDiscount?: number;
    overalNetSales?: number;
    overalFinalPrice?: number;
    overalTax?: number;
  };
  openingBalance: number;
  payments: Array<{ paymentTypeId: string; qty: number; paidAmount: number }>;
  balanceSummary?: { totalCashIn: number; totalCashOut: number };
}

export interface DailyCloseHistoryItem {
  id: string;
  userIdStart: string;
  userIdClose: string;
  userStartBy?: string | null;
  userCloseBy?: string | null;
  startDate: string;
  endDate: string;
  totalTransaction: number;
  overalFinalPrice: number;
  overalTax: number;
  summaryTotalVoid: number;
  note?: string | null;
}

export interface DailyCloseHistoryResponse {
  items: DailyCloseHistoryItem[];
  total: number;
}

export interface CashDeclarationPayload {
  denom_100k: number;
  denom_50k: number;
  denom_20k: number;
  denom_10k: number;
  denom_5k: number;
  denom_2k: number;
  denom_1k: number;
  coins_other: number;
}

@Injectable({ providedIn: 'root' })
export class DailyCloseService {
  constructor(private http: HttpClient) {}

  getSummary(resetId: string): Observable<ApiResponse<DailyCloseSummaryResponse>> {
    return this.http.get<ApiResponse<DailyCloseSummaryResponse>>(
      `${environment.apiUrl}/daily-close/${resetId}`,
    );
  }

  submit(
    resetId: string,
    payload: {
      terminalId: string;
      physicalCash: number;
      notes?: string;
      cashDeclaration: CashDeclarationPayload;
    },
  ): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${environment.apiUrl}/daily-close/${resetId}`,
      payload,
    );
  }

  getReport(resetId: string): Observable<ApiResponse<DailyCloseSummaryResponse>> {
    return this.http.get<ApiResponse<DailyCloseSummaryResponse>>(
      `${environment.apiUrl}/daily-close/report/${resetId}`,
    );
  }

  getHistory(): Observable<ApiResponse<DailyCloseHistoryResponse>> {
    return this.http.get<ApiResponse<DailyCloseHistoryResponse>>(
      `${environment.apiUrl}/daily-close/history`,
    );
  }
}
