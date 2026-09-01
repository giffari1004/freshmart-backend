import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { releaseReservedStock } from "../order/order.cancellation";

type ExpiringOrder = Prisma.OrderGetPayload<{
  select: {
    id: true;
    userId: true;
    storeId: true;
    items: {
      select: {
        productId: true;
        quantity: true;
      };
    };
    payments: {
      select: {
        id: true;
        status: true;
      };
    };
  };
}>;

export class PaymentExpiryService {
  async expireWaitingPayments(): Promise<number> {
    const orders = await this.findExpiredOrders();
    let count = 0;

    for (const order of orders) {
      count += Number(await this.expireOrder(order));
    }

    return count;
  }

  private findExpiredOrders() {
    return prisma.order.findMany({
      where: {
        status: "WAITING_PAYMENT",
        paymentDeadline: {
          not: null,
          lte: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        storeId: true,
        items: {
          select: {
            productId: true,
            quantity: true,
          },
        },
        payments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  private async expireOrder(
    order: ExpiringOrder,
  ): Promise<boolean> {
    return prisma.$transaction((tx) =>
      this.processExpiredOrder(tx, order),
    );
  }

  private async processExpiredOrder(
    tx: Prisma.TransactionClient,
    order: ExpiringOrder,
  ): Promise<boolean> {
    const claimed = await this.claimOrder(tx, order.id);

    if (!claimed) {
      return false;
    }

    await releaseReservedStock(
      tx,
      order.id,
      order.storeId,
      order.items,
      "ORDER_CANCEL",
    );

    await this.expirePayment(tx, order.payments);
    await this.createCancellationHistory(tx, order);

    return true;
  }

 private async claimOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<boolean> {
  const result = await tx.order.updateMany({
    where: {
      id: orderId,
      status: "WAITING_PAYMENT",
      paymentDeadline: {
        not: null,
        lte: new Date(),
      },
    },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  return result.count > 0;
}

  private expirePayment(
    tx: Prisma.TransactionClient,
    payments: ExpiringOrder["payments"],
  ) {
    const payment = payments.find(
      (item) => item.status === "PENDING",
    );

    if (!payment) {
      return Promise.resolve();
    }

    return tx.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "EXPIRED",
      },
    });
  }

  private createCancellationHistory(
    tx: Prisma.TransactionClient,
    order: ExpiringOrder,
  ) {
    return tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        changedById: order.userId,
        notes:
          "Order automatically cancelled because payment deadline expired",
      },
    });
  }
}