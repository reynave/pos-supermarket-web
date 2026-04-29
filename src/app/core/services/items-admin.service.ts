import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
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

  list(query: string, page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(this.API, {
      params: {
        q: query,
        page,
        limit,
      },
    });
  }

  getMeta(): Observable<any> {
    return this.http.get<any>(`${this.API}/meta`);
  }

  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API}/${encodeURIComponent(id)}`);
  }

  create(payload: ItemFormValue): Observable<any> {
    return this.http.post<any>(this.API, payload);
  }

  update(id: string, payload: ItemFormValue): Observable<any> {
    return this.http.put<any>(`${this.API}/${encodeURIComponent(id)}`, payload);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API}/${encodeURIComponent(id)}`);
  }
}