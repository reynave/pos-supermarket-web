import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromotionFree } from '../../features/promotion/data/promotion.model';


@Injectable({
  providedIn: 'root',
})
export class PromotionFreeService {
  private readonly apiUrl = '/api/promotion';

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotion_free rows for a promotion
   */
  listByPromotionId(promotionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${promotionId}/free`);
  }

  /**
   * Get single promotion_free by ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/free/${id}`);
  }

  /**
   * Create new promotion_free detail
   */
  create(data: Partial<PromotionFree>): Observable<any> {
    const promotionId = data.promotionId;
    return this.http.post<any>(`${this.apiUrl}/${promotionId}/free`, data);
  }

  /**
   * Update promotion_free detail
   */
  update(id: number, data: Partial<PromotionFree>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/free/${id}`, data);
  }

  /**
   * Delete promotion_free
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/free/${id}`);
  }
}
