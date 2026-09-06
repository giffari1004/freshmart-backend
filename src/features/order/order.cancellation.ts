import { Prisma } from "../../../generated/prisma";
import { BadRequestError } from "../../errors/BadRequestError";
import { NotFoundError } from "../../errors/NotFoundError";

interface OrderItemStock {
  productId: string;
  quantity: number;
}

interface PendingPayment {
  id: string;
  status: string;
}

const CUSTOMER_CANCEL_STATUS = "WAITING_PAYMENT" as const;

export async function cancelOrderTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  const order = await getOrder(tx, orderId, userId);
  if (order.status !== CUSTOMER_CANCEL_STATUS) {
    throw new BadRequestError(
      "Order cannot be cancelled in its current status",
    );
  }

  const claimed = await tx.order.updateMany({
    where: { id: orderId, userId, status: CUSTOMER_CANCEL_STATUS },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  if (!claimed.count) {
    throw new BadRequestError(
      "Order cannot be cancelled in its current status",
    );
  }

  await releaseReservedStock(
    tx,
    orderId,
    order.storeId,
    order.items,
    "ORDER_CANCEL",
  );
  await cancelPendingPayment(tx, order.payments);
  const cancelled = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: "CANCELLED",
      changedById: userId,
      notes: "Order cancelled by customer",
    },
  });
  return cancelled;
}

async function getOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  const order = await tx.order.findFirst({
    where: { id: orderId, userId },
    select: {
      storeId: true,
      status: true,
      items: { select: { productId: true, quantity: true } },
      payments: { select: { id: true, status: true } },
    },
  });
  if (!order) throw new NotFoundError("Order not found");
  return order;
}

export async function releaseReservedStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  items: OrderItemStock[],
  referenceType: "ORDER" | "ORDER_CANCEL" = "ORDER_CANCEL",
) {
  for (const item of items) {
    const storeProduct = await tx.storeProduct.findFirst({
      where: { storeId, productId: item.productId },
      select: { id: true },
    });
    if (!storeProduct) throw new NotFoundError("Store product not found");

    const rows = await tx.$queryRaw<
      { stockQuantity: number; reservedStock: number }[]
    >`
      UPDATE "store_products"
      SET "reservedStock" = "reservedStock" - ${item.quantity}
      WHERE "id" = ${storeProduct.id}
        AND "reservedStock" >= ${item.quantity}
      RETURNING "stockQuantity", "reservedStock"
    `;
    const updated = rows[0];
    if (!updated)
      throw new NotFoundError("Reserved stock is no longer available");

    await tx.stockJournal.create({
      data: {
        storeProductId: storeProduct.id,
        type: "RELEASE",
        quantity: item.quantity,
        beforeStock: updated.stockQuantity,
        afterStock: updated.stockQuantity,
        referenceType,
        referenceId: orderId,
        notes: "Reserved stock released",
      },
    });
  }
}

async function cancelPendingPayment(
  tx: Prisma.TransactionClient,
  payments: PendingPayment[],
) {
  const payment = payments.find((item) => item.status === "PENDING");
  if (!payment) return;
  await tx.payment.update({
    where: { id: payment.id },
    data: { status: "CANCELLED" },
  });
}
