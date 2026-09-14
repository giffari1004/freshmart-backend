import { Prisma } from "../../../generated/prisma";
import { BadRequestError } from "../../errors/BadRequestError";
import type { CreateOrderTransactionData } from "./order.transaction";
import { OrderItemCalculation } from "./helper/order.helper";
export { reserveStockItem } from "./order.transaction.stock.helper";

export async function createOrder(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
  paymentDeadline: Date,
) {
  // PERBAIKAN: hanya keluarkan field yang bukan kolom Order.
  return tx.order.create({
    data: {
      ...toOrderCreateData(data),
      orderNumber: `ORD-${Date.now()}`,
      status: "WAITING_PAYMENT",
      paymentDeadline,
    },
  });
}

function toOrderCreateData(data: CreateOrderTransactionData) {
  return {
    userId: data.userId,
    storeId: data.storeId,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    province: data.province,
    city: data.city,
    district: data.district,
    fullAddress: data.fullAddress,
    shippingMethodId: data.shippingMethodId,
    subtotal: data.subtotal,
    discountAmount: data.discountAmount,
    shippingCost: data.shippingCost,
    totalAmount: data.totalAmount,
  };
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
  await tx.orderItem.createMany({
    data: items.map((item) => toOrderItem(orderId, item)),
  });
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

export async function consumeUserVoucher(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
) {
  if (!data.userVoucherId) return;
  const updated = await tx.userVoucher.updateMany({
    where: {
      id: data.userVoucherId,
      userId: data.userId,
      isUsed: false,
    },
    data: { isUsed: true },
  });

  if (!updated.count) {
    throw new BadRequestError(
      "Voucher is already used or unavailable",
    );
  }
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
      amountDeducted: data.voucherAmount,
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
    data: buildPaymentData(
      orderId,
      orderNumber,
      amount,
      paymentDeadline,
    ),
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
  await tx.cartItem.deleteMany({
    where: { cart: { userId } },
  });
}

export async function getCreatedOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  return tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      orderVouchers: true,
      payments: true,
    },
  });
}
