import { Prisma } from "../../../../generated/prisma";
import { BadRequestError } from "../../../errors/BadRequestError";
import { ProcessWebhookData } from "./payment.webhook.type";
import {
  ensurePayment,
  updatePayment,
} from "./helper/payment.webhook.payment.helper";
import {
  findWebhookOrder,
  recordSettlementHistory,
  updateOrderAndHistory,
} from "./helper/payment.webhook.order.helper";
import {
  deductReservedStock,
  releaseWebhookStock,
} from "./helper/payment.webhook.stock.helper";
import { createWebhookEvent } from "./helper/payment.webhook.event.helper";

export async function processWebhookTransaction(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
) {
  const payment = await ensurePayment(tx, data.paymentId);

  validatePaymentOrder(payment.orderId, data.orderId);

  const order = await findWebhookOrder(tx, data.orderId);

  if (order.status !== "WAITING_PAYMENT") {
    return { duplicate: true };
  }

  validateGrossAmount(payment.amount, data.grossAmount);

  if (!await updatePayment(tx, data)) {
    return { duplicate: true };
  }

  await applyStockEffect(tx, data, order);
  await updateOrderIfNeeded(tx, data, order.status);
  await createWebhookEvent(tx, data);

  return { duplicate: false };
}

function validatePaymentOrder(
  paymentOrderId: string,
  webhookOrderId: string,
): void {
  if (paymentOrderId !== webhookOrderId) {
    throw new Error("Payment does not belong to order");
  }
}

function validateGrossAmount(
  amount: Prisma.Decimal,
  grossAmount: number,
): void {
  if (Number(amount) !== grossAmount) {
    throw new BadRequestError(
      "Webhook gross amount does not match payment amount",
    );
  }
}

async function applyStockEffect(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
  order: Awaited<ReturnType<typeof findWebhookOrder>>,
): Promise<void> {
  if (data.paymentStatus === "SETTLEMENT") {
    await deductReservedStock(
      tx,
      order.id,
      order.storeId,
      order.items,
    );
    return;
  }

  if (data.releaseStock) {
    await releaseWebhookStock(
      tx,
      order.id,
      order.storeId,
      order.items,
    );
  }
}

async function updateOrderIfNeeded(
  tx: Prisma.TransactionClient,
  data: ProcessWebhookData,
  currentStatus: string,
): Promise<void> {
  if (currentStatus === data.orderStatus) {
    return;
  }

  if (data.paymentStatus === "SETTLEMENT") {
    await recordSettlementHistory(tx, data.orderId);
    return;
  }

  await updateOrderAndHistory(
    tx,
    data.orderId,
    data.orderStatus,
    "Status updated from validated Midtrans webhook",
  );
}