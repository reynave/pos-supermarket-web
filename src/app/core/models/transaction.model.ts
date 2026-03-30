export interface Transaction {
  id: string;
  cashierId: string;
  cashierName: string;
  terminalId: string;
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  status: number;
  inputDate: string;
}

export interface TransactionDetail {
  id: number;
  transactionId: string;
  itemId: string;
  itemName: string;
  qty: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}
