export interface PaymentType {
  id: number;
  name: string;
  type: string;
  icon: string;
}

export interface Payment {
  paymentTypeId: number;
  paymentName: string;
  amount: number;
  reference: string;
}
