import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  getSummary(terminalId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/manual-cash/summary/${terminalId}`);
  }

  addCashIn(payload: { resetId?: string; terminalId: string; amount: number }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/manual-cash/add`, payload);
  }

  openDrawer(payload: { terminalId: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/manual-cash/open-drawer`, payload);
  }
}
