export interface Item {
  id: string;
  name: string;
  barcode: string;
  price: number;
  uom: string;
  categoryId: number;
  categoryName: string;
  taxId: number;
  taxPercent: number;
  stock: number;
  imageUrl: string | null;
}

export interface CartItem {
  id: string;
  itemId: string;
  name: string;
  barcode: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  uom: string;
}
