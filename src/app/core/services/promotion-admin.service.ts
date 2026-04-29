import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Promotion, PromotionListResponse } from '../../features/promotion/data/promotion.model';

@Injectable({
  providedIn: 'root',
})
export class PromotionAdminService {
  private readonly apiUrl = '/api/promotion';

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotions with search by code & description
   */
  listPromotions(q = '', page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(this.apiUrl, {
      params: { q, page: String(page), limit: String(limit) },
    });
  }

  /**
   * Get single promotion by ID
   */
  getPromotionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new promotion
   */
  createPromotion(data: Partial<Promotion>): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  /**
   * Update promotion
   */
  updatePromotion(id: string, data: Partial<Promotion>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete promotion (soft delete)
   */
  deletePromotion(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
