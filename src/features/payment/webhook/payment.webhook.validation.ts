import { z } from "zod";

export const paymentWebhookSchema = z.object({
  order_id: z.string().min(1),

  transaction_id: z.string().optional(),

  transaction_status: z.string().min(1),

  status_code: z.string().min(1),

  gross_amount: z.string().regex(/^\d+(\.\d+)?$/, "gross_amount must be numeric"),

  signature_key: z.string().min(1),

  payment_type: z.string().optional(),

  fraud_status: z.string().optional(),

  transaction_time: z.string().optional(),

  settlement_time: z.string().optional(),

  currency: z.string().optional(),
});
