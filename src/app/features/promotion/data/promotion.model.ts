export interface Promotion {
  id: string;
  typeOfPromotion: 'promotion_free' | 'promotion_item' | 'promotion_discount' | 'voucher';
  code?: string;
  description: string;
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  discountPercent?: number;
  discountAmount?: number;
  Mon: number; // 1 or 0
  Tue: number;
  Wed: number;
  Thu: number;
  Fri: number;
  Sat: number;
  Sun: number;
  status: number;
  presence: number;
  freeCount?: number;
  itemCount?: number;
  inputDate?: string;
  inputBy?: number;
  updateDate?: string;
  updateBy?: number;
}

export interface PromotionFree {
  id?: number;
  promotionId: string;
  itemId: string;
  itemDescription?: string;
  qty: number;
  freeItemId: string;
  freeItemDescription?: string;
  freeQty: number;
  applyMultiply: number; // 1 or 0
  scanFree: number; // 1 or 0
  printOnBill: number; // 1 or 0
  status?: number;
  presence?: number;
  inputDate?: string;
  inputBy?: number;
  updateDate?: string;
  updateBy?: number;
}

export interface PromotionItem {
  id?: number;
  promotionId: string;
  itemId: string;
  itemDescription?: string;
  qtyFrom: number;
  qtyTo: number;
  specialPrice: number;
  disc1: number; // percentage
  disc2: number; // percentage
  disc3: number; // percentage
  discountPrice: number; // fixed discount amount
  status?: number;
  presence?: number;
  inputDate?: string;
  inputBy?: number;
  updateDate?: string;
  updateBy?: number;
}

export interface PromotionListResponse {
  promotions: Promotion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
