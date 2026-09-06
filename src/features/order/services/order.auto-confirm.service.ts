import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";

const AUTO_CONFIRM_DAYS = 7;

export class OrderAutoConfirmService {
  async confirmExpiredShippedOrders(): Promise<number> {
    const cutoff = this.getCutoffDate();
    const orders = await this.findEligibleOrders(cutoff);
    let count = 0;

    for (const order of orders) {
      count += Number(
        await this.confirmOrder(order.id, cutoff),
      );
    }

    return count;
  }

  private getCutoffDate(): Date {
    return new Date(
      Date.now() -
        AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000,
    );
  }

  private findEligibleOrders(cutoff: Date) {
    return prisma.order.findMany({
      where: {
        status: "SHIPPED",
        shippedAt: {
          not: null,
          lte: cutoff,
        },
      },
      select: {
        id: true,
      },
    });
  }

  private confirmOrder(
    orderId: string,
    cutoff: Date,
  ): Promise<boolean> {
    return prisma.$transaction((tx) =>
      this.processConfirmation(
        tx,
        orderId,
        cutoff,
      ),
    );
  }

  private async processConfirmation(
    tx: Prisma.TransactionClient,
    orderId: string,
    cutoff: Date,
  ): Promise<boolean> {
    const claimed = await this.claimOrder(
      tx,
      orderId,
      cutoff,
    );

    if (!claimed) {
      return false;
    }

    await this.createHistory(tx, orderId);

    return true;
  }

  private async claimOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    cutoff: Date,
  ): Promise<boolean> {
    const result = await tx.order.updateMany({
      where: {
        id: orderId,
        status: "SHIPPED",
        shippedAt: {
          not: null,
          lte: cutoff,
        },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    return result.count > 0;
  }

  private createHistory(
    tx: Prisma.TransactionClient,
    orderId: string,
  ) {
    return tx.orderStatusHistory.create({
      data: {
        orderId,
        status: "CONFIRMED",
        notes:
          "Order automatically confirmed after 7 days",
      },
    });
  }
}