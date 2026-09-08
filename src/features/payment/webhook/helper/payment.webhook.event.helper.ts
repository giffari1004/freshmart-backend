import { Prisma } from "../../../../../generated/prisma";
import { ProcessWebhookData } from "../payment.webhook.type";

export async function createWebhookEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
): Promise<void> {
  await tx.paymentWebhookEvent.create({
    data: {
      paymentId: data.paymentId,
      orderId: data.orderId,
      transactionId: data.transactionId,
      transactionStatus: data.transactionStatus,
      statusCode: data.statusCode,
      grossAmount: data.grossAmount,
      signatureKey: data.signatureKey,
      payload: data.payload,
      isValid: true,
      processedAt: new Date(),
    },
  });
}