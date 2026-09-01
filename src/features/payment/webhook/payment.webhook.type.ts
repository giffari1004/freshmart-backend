import { Prisma } from "../../../../generated/prisma";

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
export interface WebhookStatus {
  paymentStatus: "SETTLEMENT" | "EXPIRED" | "DENIED" | "CANCELLED";
  orderStatus: "WAITING_CONFIRMATION" | "CANCELLED";
  releaseStock: boolean;
}
export interface ProcessWebhookData {
  paymentId: string;
  orderId: string;
  transactionId: string | null;
  transactionStatus: string;
  statusCode: string;
  grossAmount: number;
  signatureKey: string;
  payload: Prisma.InputJsonValue;
  paymentStatus: WebhookStatus["paymentStatus"];
  orderStatus: WebhookStatus["orderStatus"];
  releaseStock: boolean;
}
