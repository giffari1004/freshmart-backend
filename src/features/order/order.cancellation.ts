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
  // PERBAIKAN: detail release dipisahkan agar function tetap kecil.
  for (const item of items) {
    await releaseReservedItem(
      tx,
      orderId,
      storeId,
      item,
      referenceType,
    );
  }
}

async function releaseReservedItem(
  tx: Prisma.TransactionClient,
  orderId: string,
  storeId: string,
  item: OrderItemStock,
  referenceType: "ORDER" | "ORDER_CANCEL",
) {
  const storeProduct = await findStoreProduct(
    tx,
    storeId,
    item.productId,
  );
  const updated = await decrementReservedStock(
    tx,
    storeProduct.id,
    item.quantity,
  );

  await createReleaseJournal(
    tx,
    orderId,
    item,
    storeProduct.id,
    updated.stockQuantity,
    referenceType,
  );
}

async function findStoreProduct(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string,
) {
  const product = await tx.storeProduct.findFirst({
    where: { storeId, productId },
    select: { id: true },
  });

  if (!product) {
    throw new NotFoundError("Store product not found");
  }

  return product;
}

async function decrementReservedStock(
  tx: Prisma.TransactionClient,
  storeProductId: string,
  quantity: number,
) {
  const rows = await tx.$queryRaw<
    { stockQuantity: number; reservedStock: number }[]
  >`
    UPDATE "store_products"
    SET "reservedStock" = "reservedStock" - ${quantity}
    WHERE "id" = ${storeProductId}
      AND "reservedStock" >= ${quantity}
    RETURNING "stockQuantity", "reservedStock"
  `;

  const updated = rows[0];
  if (!updated) {
    throw new NotFoundError(
      "Reserved stock is no longer available",
    );
  }

  return updated;
}

async function createReleaseJournal(
  tx: Prisma.TransactionClient,
  orderId: string,
  item: OrderItemStock,
  storeProductId: string,
  stockQuantity: number,
  referenceType: "ORDER" | "ORDER_CANCEL",
) {
  await tx.stockJournal.create({
    data: {
      storeProductId,
      type: "RELEASE",
      quantity: item.quantity,
      beforeStock: stockQuantity,
      afterStock: stockQuantity,
      referenceType,
      referenceId: orderId,
      notes: "Reserved stock released",
    },
  });
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
