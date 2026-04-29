import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PromotionItem } from '../../features/promotion/data/promotion.model';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class PromotionItemService {
  private readonly apiUrl = `${environment.apiUrl}/promotion`;

  constructor(private readonly http: HttpClient) {}

  /**
   * List all promotion_item rows for a promotion
   */
  listByPromotionId(promotionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${promotionId}/item`);
  }

  /**
   * Get single promotion_item by ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/item/${id}`);
  }

  /**
   * Create new promotion_item detail
   */
  create(data: Partial<PromotionItem>): Observable<any> {
    const promotionId = data.promotionId;
    return this.http.post<any>(`${this.apiUrl}/${promotionId}/item`, data);
  }

  /**
   * Update promotion_item detail
   */
  update(id: number, data: Partial<PromotionItem>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/item/${id}`, data);
  }

  /**
   * Delete promotion_item
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/item/${id}`);
  }
}
