import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Promotion, PromotionListResponse } from '../../features/promotion/data/promotion.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PromotionAdminService {
  private readonly apiUrl = '/api/promotion';

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotions with search by code & description
   */
  listPromotions(q = '', page = 1, limit = 20): Observable<ApiResponse<PromotionListResponse>> {
    return this.http.get<ApiResponse<PromotionListResponse>>(this.apiUrl, {
      params: { q, page: String(page), limit: String(limit) },
    });
  }

  /**
   * Get single promotion by ID
   */
  getPromotionById(id: string): Observable<ApiResponse<Promotion>> {
    return this.http.get<ApiResponse<Promotion>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new promotion
   */
  createPromotion(data: Partial<Promotion>): Observable<ApiResponse<Promotion>> {
    return this.http.post<ApiResponse<Promotion>>(this.apiUrl, data);
  }

  /**
   * Update promotion
   */
  updatePromotion(id: string, data: Partial<Promotion>): Observable<ApiResponse<Promotion>> {
    return this.http.put<ApiResponse<Promotion>>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete promotion (soft delete)
   */
  deletePromotion(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
