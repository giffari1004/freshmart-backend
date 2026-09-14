import { Prisma } from "../../../generated/prisma";

import type { OrderItemCalculation } from "./helper/order.helper";
import type { OrderDiscountUsage } from "./helper/order.discount-usage.helper";
import {
  clearCartItems,
  consumeUserVoucher,
  createInitialStatusHistory,
  createOrder,
  createOrderItems,
  createOrderVoucher,
  createPayment,
  getCreatedOrder,
  reserveStockItem,
} from "./order.transaction.helper";

// PERBAIKAN: data transaction hanya berisi field yang benar-benar dipakai Order.
export interface CreateOrderTransactionData {
  userId: string;
  storeId: string;
  recipientName: string;
  recipientPhone: string;
  province: string;
  city: string;
  district: string;
  fullAddress: string;
  shippingMethodId: string;
  subtotal: number;
  discountAmount: number;
  voucherAmount: number;
  shippingCost: number;
  totalAmount: number;
  userVoucherId?: string;
  items: OrderItemCalculation[];
  discountUsages: OrderDiscountUsage[];
}

export async function runCreateOrderTransaction(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
) {
  const deadline = createPaymentDeadline();
  // PERBAIKAN: usage discount tidak lagi dipaksakan ke Feature 3.
  const order = await createOrder(tx, data, deadline);
  await createOrderDetails(tx, data, order.id);
  await createPaymentAndClearCart(tx, data, order, deadline);
  return getCreatedOrder(tx, order.id);
}

function createPaymentDeadline() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

async function createOrderDetails(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
  orderId: string,
) {
  await createInitialStatusHistory(tx, orderId, data.userId);
  await createOrderItems(tx, orderId, data.items);
  await reserveStock(tx, orderId, data.items);
  await createDiscountUsages(tx, data.userId, orderId, data.discountUsages);
  await consumeUserVoucher(tx, data);
  await createOrderVoucher(tx, orderId, data);
}

async function createPaymentAndClearCart(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
  order: { id: string; orderNumber: string },
  deadline: Date,
) {
  await createPayment(
    tx,
    order.id,
    order.orderNumber,
    data.totalAmount,
    deadline,
  );
  await clearCartItems(tx, data.userId);
}

async function createDiscountUsages(
  tx: Prisma.TransactionClient,
  userId: string,
  orderId: string,
  usages: OrderDiscountUsage[],
) {
  if (!usages.length) return;
  await tx.discountUsage.createMany({
    data: usages.map((usage) => ({
      discountId: usage.discountId,
      userId,
      orderId,
      amountDeducted: usage.amountDeducted,
    })),
  });
}

async function reserveStock(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderItemCalculation[],
) {
  for (const item of items) {
    await reserveStockItem(tx, orderId, item);
  }
}
