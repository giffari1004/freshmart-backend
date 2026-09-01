import { Prisma } from "../../../../../generated/prisma";
import { ProcessWebhookData } from "../payment.webhook.type";
import { NotFoundError } from "../../../../errors/NotFoundError";

export async function ensurePayment(
  tx: Prisma.TransactionClient,
  paymentId: string,
) {
  const payment = await tx.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  return payment;
}

export async function hasEvent(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
): Promise<boolean> {
  const event = await tx.paymentWebhookEvent.findFirst({
    where: {
      orderId: data.orderId,
      transactionId: data.transactionId,
      transactionStatus: data.transactionStatus,
    },
  });

  return Boolean(event);
}

export async function updatePayment(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
): Promise<boolean> {
  const result = await tx.payment.updateMany({
    where: {
      id: data.paymentId,
      status: "PENDING",
    },
    data: {
      status: data.paymentStatus,
      gatewayTransactionId: data.transactionId,
      paidAt: settlementDate(data),
      expiredAt: expiryDate(data),
    },
  });

  return result.count === 1;
}

function settlementDate(
  data: ProcessWebhookData,
): Date | undefined {
  return data.paymentStatus === "SETTLEMENT"
    ? new Date()
    : undefined;
}

function expiryDate(
  data: ProcessWebhookData,
): Date | undefined {
  return data.paymentStatus === "EXPIRED"
    ? new Date()
    : undefined;
}