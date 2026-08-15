import { Prisma } from "../../../../generated/prisma";
import { ProcessWebhookData } from "./payment.webhook.type";

export async function processWebhookTransaction(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  if (await hasEvent(tx, data)) return { duplicate: true };
  const payment = await tx.payment.findUnique({
    where: { id: data.paymentId },
  });
  if (!payment) throw new Error("Payment not found");
  await updatePayment(tx, data);
  await tx.order.update({
    where: { id: data.orderId },
    data: { status: data.orderStatus },
  });
  if (data.releaseStock) await releaseStock(tx, data.orderId);
  await createEvent(tx, data);
  return { duplicate: false };
}

async function hasEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  return Boolean(
    await tx.paymentWebhookEvent.findFirst({
      where: {
        orderId: data.orderId,
        transactionId: data.transactionId,
        transactionStatus: data.transactionStatus,
      },
    }),
  );
}

async function updatePayment(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  await tx.payment.update({
    where: { id: data.paymentId },
    data: {
      status: data.paymentStatus,
      gatewayTransactionId: data.transactionId,
      paidAt: data.paymentStatus === "SETTLEMENT" ? new Date() : undefined,
    },
  });
}

async function releaseStock(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items)
    await tx.$executeRaw`UPDATE "store_products" SET "reservedStock" = GREATEST("reservedStock" - ${item.quantity}, 0) WHERE "id" = ${item.productId}`;
}

async function createEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
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
