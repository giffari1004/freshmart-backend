export interface CreatePaymentRequest {
  orderId: string;
  grossAmount: number;
}

export interface CreatePaymentResponse {
  orderId: string;
  snapToken: string;
  paymentUrl: string;
}