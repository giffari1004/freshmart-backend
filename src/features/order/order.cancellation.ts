import { Prisma } from "../../../generated/prisma";
import { NotFoundError } from "../../errors/NotFoundError";

interface OrderItemStock {
  productId: string;
  quantity: number;
}

interface PendingPayment {
  id: string;
  status: string;
}

export async function cancelOrderTransaction(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  const order = await getOrder(tx, orderId, userId);
  await releaseReservedStock(tx, order.storeId, order.items);
  await cancelPendingPayment(tx, order.payments);
  return tx.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
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
      items: { select: { productId: true, quantity: true } },
      payments: { select: { id: true, status: true } },
    },
  });

  if (!order) throw new NotFoundError("Order not found");
  return order;
}

async function releaseReservedStock(
  tx: Prisma.TransactionClient,
  storeId: string,
  items: OrderItemStock[],
) {
  for (const item of items) {
    const storeProductId = await findStoreProductId(tx, storeId, item.productId);
    await releaseItemStock(tx, storeProductId, item.quantity);
  }
}

async function findStoreProductId(
  tx: Prisma.TransactionClient,
  storeId: string,
  productId: string,
) {
  const storeProduct = await tx.storeProduct.findFirst({
    where: { storeId, productId },
    select: { id: true },
  });

  if (!storeProduct) throw new NotFoundError("Store product not found");
  return storeProduct.id;
}

async function releaseItemStock(
  tx: Prisma.TransactionClient,
  storeProductId: string,
  quantity: number,
) {
  await tx.$executeRaw`
    UPDATE "store_products"
    SET "reservedStock" = GREATEST("reservedStock" - ${quantity}, 0)
    WHERE "id" = ${storeProductId}
  `;
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
