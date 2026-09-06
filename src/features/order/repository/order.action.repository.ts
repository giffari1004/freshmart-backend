import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import {
  runCreateOrderTransaction,
  CreateOrderTransactionData,
} from "../order.transaction";
import { cancelOrderTransaction } from "../order.cancellation";

export class OrderActionRepository {
  createOrderTransaction(data: CreateOrderTransactionData) {
    return prisma.$transaction((tx) =>
      runCreateOrderTransaction(tx, data),
    );
  }

  cancelOrder(orderId: string, userId: string) {
    return prisma.$transaction((tx) =>
      cancelOrderTransaction(tx, orderId, userId),
    );
  }

  async confirmOrder(orderId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const order = await findShippedOrder(tx, orderId, userId);
      if (!order) return null;
      return confirmShippedOrder(tx, order.id, userId);
    });
  }
}

function findShippedOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  return tx.order.findFirst({
    where: { id: orderId, userId, status: "SHIPPED" },
    select: { id: true },
  });
}

async function confirmShippedOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  userId: string,
) {
  const updated = await tx.order.update({
    where: { id: orderId },
    data: { status: "CONFIRMED", confirmedAt: new Date() },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId,
      status: "CONFIRMED",
      changedById: userId,
      notes: "Order confirmed by customer",
    },
  });

  return updated;
}
