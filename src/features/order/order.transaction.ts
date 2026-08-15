import { Prisma } from "../../../generated/prisma";
import { BadRequestError } from "../../errors/BadRequestError";
import { OrderItemCalculation } from "./helper/order.helper";

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
  shippingCost: number;
  totalAmount: number;
  userVoucherId?: string;
  items: OrderItemCalculation[];
}

export async function runCreateOrderTransaction(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
) {
  const order = await createOrder(tx, data);
  await createOrderItems(tx, order.id, data.items);
  await reserveStock(tx, data.items);
  await createOrderVoucher(tx, order.id, data);
  await createPayment(tx, order.id, order.orderNumber, data.totalAmount);
  return tx.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { items: true, orderVouchers: true, payments: true },
  });
}

async function createOrder(
  tx: Prisma.TransactionClient,
  data: CreateOrderTransactionData,
) {
  return tx.order.create({ data: buildOrderData(data) });
}

function buildOrderData(data: CreateOrderTransactionData) {
  return {
    orderNumber: `ORD-${Date.now()}`,
    userId: data.userId,
    storeId: data.storeId,
    recipientName: data.recipientName,
    recipientPhone: data.recipientPhone,
    province: data.province,
    city: data.city,
    district: data.district,
    fullAddress: data.fullAddress,
    shippingMethodId: data.shippingMethodId,
    status: "WAITING_PAYMENT" as const,
    subtotal: data.subtotal,
    discountAmount: data.discountAmount,
    shippingCost: data.shippingCost,
    totalAmount: data.totalAmount,
  };
}

async function createOrderItems(
  tx: Prisma.TransactionClient,
  orderId: string,
  items: OrderItemCalculation[],
) {
  await tx.orderItem.createMany({
    data: items.map((item) => ({
      orderId,
      productId: item.productId,
      productNameSnapshot: item.productName,
      priceSnapshot: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
  });
}

async function reserveStock(
  tx: Prisma.TransactionClient,
  items: OrderItemCalculation[],
) {
  for (const item of items) {
    const updatedRows =
      await tx.$executeRaw`UPDATE "store_products" SET "reservedStock" = "reservedStock" + ${item.quantity} WHERE "id" = ${item.storeProductId} AND ("stockQuantity" - "reservedStock") >= ${item.quantity}`;
    if (updatedRows === 0)
      throw new BadRequestError(
        `Insufficient stock for product ${item.productName}`,
      );
  }
}

async function createOrderVoucher(
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

async function createPayment(
  tx: Prisma.TransactionClient,
  orderId: string,
  orderNumber: string,
  amount: number,
) {
  await tx.payment.create({
    data: {
      orderId,
      method: "GATEWAY",
      status: "PENDING",
      amount,
      gatewayOrderId: orderNumber,
    },
  });
}
