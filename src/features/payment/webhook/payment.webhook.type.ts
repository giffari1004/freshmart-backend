export interface MidtransWebhookRequest {
  order_id: string;
  transaction_id?: string;
  transaction_status: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;

  payment_type?: string;
  fraud_status?: string;
  transaction_time?: string;
  settlement_time?: string;

  currency?: string;
}

export interface PaymentWebhookResult {
  success: boolean;
  message: string;
}