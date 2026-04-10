import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromotionItem } from '../../features/promotion/data/promotion.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class PromotionItemService {
  private readonly apiUrl = '/api/promotion';

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotion_item rows for a promotion
   */
  listByPromotionId(promotionId: string): Observable<ApiResponse<PromotionItem[]>> {
    return this.http.get<ApiResponse<PromotionItem[]>>(
      `${this.apiUrl}/${promotionId}/item`
    );
  }

  /**
   * Get single promotion_item by ID
   */
  getById(id: number): Observable<ApiResponse<PromotionItem>> {
    return this.http.get<ApiResponse<PromotionItem>>(`${this.apiUrl}/item/${id}`);
  }

  /**
   * Create new promotion_item detail
   */
  create(data: Partial<PromotionItem>): Observable<ApiResponse<PromotionItem>> {
    const promotionId = data.promotionId;
    return this.http.post<ApiResponse<PromotionItem>>(
      `${this.apiUrl}/${promotionId}/item`,
      data
    );
  }

  /**
   * Update promotion_item detail
   */
  update(id: number, data: Partial<PromotionItem>): Observable<ApiResponse<PromotionItem>> {
    return this.http.put<ApiResponse<PromotionItem>>(`${this.apiUrl}/item/${id}`, data);
  }

  /**
   * Delete promotion_item
   */
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/item/${id}`);
  }
}
