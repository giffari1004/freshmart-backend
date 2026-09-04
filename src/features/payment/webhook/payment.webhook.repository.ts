import { Prisma } from "../../../../generated/prisma";
import { prisma } from "../../../configs/prisma-client-config";
import { ProcessWebhookData } from "./payment.webhook.type";
import { processWebhookTransaction } from "./payment.webhook.transaction";

export class PaymentWebhookRepository {
  async findPaymentByGatewayOrderId(gatewayOrderId: string) {
    return prisma.payment.findFirst({
      where: { gatewayOrderId },
      select: {
        id: true,
        orderId: true,
      },
    });
  }

  async findWebhookEvent(
    orderId: string,
    transactionId: string | null,
    transactionStatus: string,
  ) {
    return prisma.paymentWebhookEvent.findFirst({
      where: {
        orderId,
        transactionId,
        transactionStatus,
      },
      select: {
        id: true,
      },
    });
  }

  async processWebhook(data: ProcessWebhookData) {
    try {
      return await prisma.$transaction((tx) =>
        processWebhookTransaction(tx, data),
      );
    } catch (error) {
      if (this.isDuplicateError(error)) {
        return { duplicate: true };
      }

      throw error;
    }
  }

  private isDuplicateError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    );
  }
}