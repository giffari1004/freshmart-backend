import { Prisma } from "../../../generated/prisma";
import { BadRequestError } from "../../errors/BadRequestError";
import type { CreateOrderTransactionData } from "./order.transaction";
import { OrderItemCalculation } from "./helper/order.helper";

export async function createOrder(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
  paymentDeadline: Date,
) {
  const { items, userVoucherId, ...orderData } = data;
  return tx.order.create({
    data: {
      ...orderData,
      orderNumber: `ORD-${Date.now()}`,
      status: "WAITING_PAYMENT",
      paymentDeadline,
    },
  });
}

export async function createInitialStatusHistory(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: "WAITING_PAYMENT",
      changedById: userId,
      notes: "Order created",
    },
  });
}

export async function createOrderItems(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderItemCalculation[],
) {
  await tx.orderItem.createMany({ data: items.map((item) => toOrderItem(orderId, item)) });
}

function toOrderItem(orderId: string, item: OrderItemCalculation) {
  return {
    orderId,
    productId: item.productId,
    productNameSnapshot: item.productName,
    priceSnapshot: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  };
}

export async function reserveStockItem(
  tx: Prisma.TransactionClient,
  orderId: string,
  item: OrderItemCalculation,
) {
  const stock = await updateReservedStock(tx, item);
  if (!stock) throw new BadRequestError(`Insufficient stock for product ${item.productName}`);
  await createReserveJournal(tx, orderId, item, stock.stockQuantity);
}

async function updateReservedStock(
  tx: Prisma.TransactionClient,
  item: OrderItemCalculation,
) {
  const rows = await tx.$queryRaw<
    { stockQuantity: number; reservedStock: number }[]
  >`
    UPDATE "store_products"
    SET "reservedStock" = "reservedStock" + ${item.quantity}
    WHERE "id" = ${item.storeProductId}
      AND ("stockQuantity" - "reservedStock") >= ${item.quantity}
    RETURNING "stockQuantity", "reservedStock"
  `;
  return rows[0];
}

export async function createReserveJournal(
  tx: Prisma.TransactionClient,
  orderId: string,
  item: OrderItemCalculation,
  stockQuantity: number,
) {
  await tx.stockJournal.create({
    data: buildReserveJournalData(orderId, item, stockQuantity),
  });
}

function buildReserveJournalData(orderId: string, item: OrderItemCalculation, stockQuantity: number) {
  return {
    storeProductId: item.storeProductId,
    type: "RESERVE" as const,
    quantity: item.quantity,
    beforeStock: stockQuantity,
    afterStock: stockQuantity,
    referenceType: "ORDER" as const,
    referenceId: orderId,
    notes: "Stock reserved for order",
  };
}

export async function consumeUserVoucher(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
) {
  if (!data.userVoucherId) return;
  const updated = await tx.userVoucher.updateMany({
    where: { id: data.userVoucherId, userId: data.userId, isUsed: false },
    data: { isUsed: true },
  });
  if (!updated.count) throw new BadRequestError("Voucher is already used or unavailable");
}

export async function createOrderVoucher(
  tx: Prisma.TransactionClient,
  orderId: string,
  data: CreateOrderTransactionData,
) {
  if (!data.userVoucherId) return;
  await tx.orderVoucher.create({
    data: {
      orderId,
      userVoucherId: data.userVoucherId,
      amountDeducted: data.discountAmount,
    },
  });
}

export async function createPayment(
  tx: Prisma.TransactionClient,
  orderId: string,
  orderNumber: string,
  amount: number,
  paymentDeadline: Date,
) {
  await tx.payment.create({
    data: buildPaymentData(orderId, orderNumber, amount, paymentDeadline),
  });
}

function buildPaymentData(
  orderId: string,
  orderNumber: string,
  amount: number,
  paymentDeadline: Date,
) {
  return {
    orderId,
    method: "GATEWAY" as const,
    status: "PENDING" as const,
    amount,
    gatewayOrderId: orderNumber,
    expiredAt: paymentDeadline,
  };
}

export async function clearCartItems(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  await tx.cartItem.deleteMany({ where: { cart: { userId } } });
}

export async function getCreatedOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  return tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, orderVouchers: true, payments: true },
  });
}
