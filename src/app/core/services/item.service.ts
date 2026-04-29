import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../models/item.model';

/** Raw shape returned by backend item endpoints */
interface BackendItem {
  id: string;
  description: string;
  shortDesc: string;
  priceFlag: number | null;
  ppnFlag: number | null;
  price1: number | null;
  itemUomId: string | null;
  itemCategoryId: string | null;
  itemTaxId: string | null;
  images: string | null;
  barcode?: string;
  barcodes?: string[];
}

/** Raw shape returned by GET /api/item/search */
interface BackendSearchResult {
  count: number;
  items: BackendItem[];
}

/** Raw shape returned by POST /api/item/barcode and POST /api/item/add */
interface BackendCartInsertResult extends BackendItem {
  cartId: number;
  kioskUuid: string;
}

interface AddQtyResult {
  kioskUuid: string;
  itemId: string;
  qty: number;
  insertedCount: number;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly API = environment.apiUrl;
  private readonly PPN_RATE = 11; // PPN Indonesia 11%

  constructor(private http: HttpClient) {}

  /** Search items by description keyword (GET) */
  searchItems(q: string): Observable<Item[]> {
    return this.http
      .get<any>(`${this.API}/item/search`, { params: { q } })
      .pipe(map((res) => (res.success && res.data?.items ? res.data.items.map((i: any) => this.mapToItem(i)) : [])));
  }

  /**
   * POST /api/item/barcode — scan barcode, lookup + insert to kiosk_cart in one call.
   * Returns the matched Item (with cartId) or null if not found.
   */
  addByBarcode(kioskUuid: string, barcode: string): Observable<Item | null> {
    return this.http
      .post<any>(`${this.API}/item/barcode`, { kioskUuid, barcode })
      .pipe(
        map((res) => (res.success && res.data ? this.mapToItem(res.data) : null)),
        catchError(() => of(null)),
      );
  }

  /**
   * POST /api/item/add — add item to kiosk_cart by itemId.
   * Returns the matched Item (with cartId) or null if not found.
   */
  addByItemId(kioskUuid: string, itemId: string): Observable<Item | null> {
    return this.http
      .post<any>(`${this.API}/item/add`, { kioskUuid, itemId })
      .pipe(
        map((res) => (res.success && res.data ? this.mapToItem(res.data) : null)),
        catchError(() => of(null)),
      );
  }

  /**
   * POST /api/item/add-qty — duplicate selected item rows to kiosk_cart based on qty.
   */
  addQtyBySelected(kioskUuid: string, itemId: string, qty: number, barcode?: string): Observable<AddQtyResult | null> {
    return this.http
      .post<any>(`${this.API}/item/add-qty`, { kioskUuid, itemId, qty, barcode })
      .pipe(
        map((res) => (res.success && res.data ? res.data : null)),
        catchError(() => of(null)),
      );
  }

  /** Map backend item fields → frontend Item model */
  private mapToItem(raw: BackendItem): Item {
    const barcode = raw.barcode ?? raw.barcodes?.[0] ?? raw.id;
    const hasTax = raw.ppnFlag === 1 || raw.itemTaxId === '2'; // item_tax id=2 = Enable

    return {
      id: raw.id,
      name: raw.description || raw.shortDesc || '',
      barcode,
      price: raw.price1 ?? 0,
      uom: raw.itemUomId ?? 'Pcs',
      categoryId: raw.itemCategoryId ? parseInt(raw.itemCategoryId, 10) || 0 : 0,
      categoryName: '',
      taxId: raw.itemTaxId ? parseInt(raw.itemTaxId, 10) || 0 : 0,
      taxPercent: hasTax ? this.PPN_RATE : 0,
      stock: 0,
      imageUrl: raw.images ?? null,
    };
  }
}
