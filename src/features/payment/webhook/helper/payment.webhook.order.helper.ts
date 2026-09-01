import { Prisma } from "../../../../../generated/prisma";
import { NotFoundError } from "../../../../errors/NotFoundError";
import { ProcessWebhookData } from "../payment.webhook.type";

export async function findWebhookOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      storeId: true,
      status: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
    },
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  return order;
}

export async function updateOrderAndHistory(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: ProcessWebhookData["orderStatus"],
  notes: string,
): Promise<void> {
  await tx.order.update({
    where: { id: orderId },
    data: { status, cancelledAt: cancelledDate(status) },
  });

  await tx.orderStatusHistory.create({
    data: { orderId, status, notes },
  });
}

export async function recordSettlementHistory(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  await tx.order.update({
    where: { id: orderId },
    data: { status: "PAID" },
  });
  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: "PAID",
      notes: "Payment settled through Midtrans gateway",
    },
  });
  await updateOrderAndHistory(
    tx,
    orderId,
    "WAITING_CONFIRMATION",
    "Status updated from validated Midtrans webhook",
  );
}

function cancelledDate(
  status: ProcessWebhookData["orderStatus"],
): Date | undefined {
  return status === "CANCELLED"
    ? new Date()
    : undefined;
}