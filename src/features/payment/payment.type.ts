export interface CreatePaymentRequest {
  orderId: string;
}

export interface CreatePaymentResponse {
  orderId: string;
  paymentId: string;
  snapToken: string;
  paymentUrl: string;
}
