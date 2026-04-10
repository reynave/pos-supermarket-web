import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromotionFree } from '../../features/promotion/data/promotion.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PromotionFreeService {
  private readonly apiUrl = '/api/promotion';

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotion_free rows for a promotion
   */
  listByPromotionId(promotionId: string): Observable<ApiResponse<PromotionFree[]>> {
    return this.http.get<ApiResponse<PromotionFree[]>>(
      `${this.apiUrl}/${promotionId}/free`
    );
  }

  /**
   * Get single promotion_free by ID
   */
  getById(id: number): Observable<ApiResponse<PromotionFree>> {
    return this.http.get<ApiResponse<PromotionFree>>(`${this.apiUrl}/free/${id}`);
  }

  /**
   * Create new promotion_free detail
   */
  create(data: Partial<PromotionFree>): Observable<ApiResponse<PromotionFree>> {
    const promotionId = data.promotionId;
    return this.http.post<ApiResponse<PromotionFree>>(
      `${this.apiUrl}/${promotionId}/free`,
      data
    );
  }

  /**
   * Update promotion_free detail
   */
  update(id: number, data: Partial<PromotionFree>): Observable<ApiResponse<PromotionFree>> {
    return this.http.put<ApiResponse<PromotionFree>>(`${this.apiUrl}/free/${id}`, data);
  }

  /**
   * Delete promotion_free
   */
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/free/${id}`);
  }
}
