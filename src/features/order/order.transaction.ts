import { Prisma } from "../../../generated/prisma";
import { OrderItemCalculation } from "./helper/order.helper";
import {
  clearCartItems,
  consumeUserVoucher,
  createInitialStatusHistory,
  createOrder,
  createOrderItems,
  createOrderVoucher,
  createPayment,
  createReserveJournal,
  getCreatedOrder,
  reserveStockItem,
} from "./order.transaction.helper";

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
  const deadline = new Date(Date.now() + 60 * 60 * 1000);
  const order = await createOrder(tx, data, deadline);
  await createInitialStatusHistory(tx, order.id, data.userId);
  await createOrderItems(tx, order.id, data.items);
  await reserveStock(tx, order.id, data.items);
  await consumeUserVoucher(tx, data);
  await createOrderVoucher(tx, order.id, data);
  await createPayment(tx, order.id, order.orderNumber, data.totalAmount, deadline);
  await clearCartItems(tx, data.userId);
  return getCreatedOrder(tx, order.id);
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
