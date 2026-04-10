import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ItemAdminDetail,
  ItemAdminListResponse,
  ItemFormValue,
  ItemsAdminMeta,
} from '../../features/items/data/item-admin.model';

@Injectable({ providedIn: 'root' })
export class ItemsAdminService {
  private readonly API = `${environment.apiUrl}/items`;

  constructor(private readonly http: HttpClient) {}

  list(query: string, page = 1, limit = 20): Observable<ApiResponse<ItemAdminListResponse>> {
    return this.http.get<ApiResponse<ItemAdminListResponse>>(this.API, {
      params: {
        q: query,
        page,
        limit,
      },
    });
  }

  getMeta(): Observable<ApiResponse<ItemsAdminMeta>> {
    return this.http.get<ApiResponse<ItemsAdminMeta>>(`${this.API}/meta`);
  }

  getById(id: string): Observable<ApiResponse<ItemAdminDetail>> {
    return this.http.get<ApiResponse<ItemAdminDetail>>(`${this.API}/${encodeURIComponent(id)}`);
  }

  create(payload: ItemFormValue): Observable<ApiResponse<ItemAdminDetail>> {
    return this.http.post<ApiResponse<ItemAdminDetail>>(this.API, payload);
  }

  update(id: string, payload: ItemFormValue): Observable<ApiResponse<ItemAdminDetail>> {
    return this.http.put<ApiResponse<ItemAdminDetail>>(`${this.API}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<ApiResponse<{ id: string }>> {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.API}/${encodeURIComponent(id)}`);
  }
}