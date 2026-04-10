export interface ItemAdminListItem {
  id: string;
  description: string;
  shortDesc: string;
  price1: number;
  itemUomId: string;
  itemUomName: string;
  itemCategoryId: string;
  itemCategoryName: string;
  itemTaxId: string;
  itemTaxName: string;
  images: string;
  status: number;
  presence: number;
  inputBy: number | null;
  inputDate: number | null;
  updateBy: number | null;
  updateDate: number | null;
  primaryBarcode: string;
  barcodeCount: number;
}

export interface ItemBarcodeDetail {
  id: number;
  barcode: string;
  status: number;
  presence: number;
  inputBy: number | null;
  inputDate: number | null;
  updateBy: number | null;
  updateDate: number | null;
}

export interface ItemAdminDetail extends ItemAdminListItem {
  priceFlag: number | null;
  ppnFlag: number | null;
  price2: number | null;
  price3: number | null;
  price4: number | null;
  price5: number | null;
  price6: number | null;
  price7: number | null;
  price8: number | null;
  price9: number | null;
  price10: number | null;
  barcodes: ItemBarcodeDetail[];
}

export interface ItemCategoryOption {
  id: string;
  parentId: number;
  name: string;
}

export interface ItemUomOption {
  id: string;
  name: string;
  description: string;
}

export interface ItemTaxOption {
  id: string;
  description: string;
}

export interface ItemsAdminMeta {
  categories: ItemCategoryOption[];
  uoms: ItemUomOption[];
  taxes: ItemTaxOption[];
}

export interface ItemFormValue {
  id: string;
  description: string;
  shortDesc: string;
  price1: number;
  itemUomId: string;
  itemCategoryId: string;
  itemTaxId: string;
  images: string;
  status: number;
  barcodes: string[];
}

export interface ItemAdminListResponse {
  items: ItemAdminListItem[];
  total: number;
  page: number;
  limit: number;
  query: string;
}

export function createEmptyItemForm(): ItemFormValue {
  return {
    id: '',
    description: '',
    shortDesc: '',
    price1: 0,
    itemUomId: '',
    itemCategoryId: '',
    itemTaxId: '2',
    images: '',
    status: 1,
    barcodes: [''],
  };
}