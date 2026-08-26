import { prisma } from "../../../configs/prisma-client-config";
import { Prisma } from "../../../../generated/prisma";
import { ProcessWebhookData } from "./payment.webhook.type";
import { processWebhookTransaction } from "./payment.webhook.transaction";

export class PaymentWebhookRepository {
  async findPaymentByGatewayOrderId(gatewayOrderId: string) {
    return prisma.payment.findFirst({ where: { gatewayOrderId }, include: { order: true } });
  }

  async findWebhookEvent(orderId: string, transactionId: string | null, transactionStatus: string) {
    return prisma.paymentWebhookEvent.findFirst({
      where: { orderId, transactionId, transactionStatus },
    });
  }

  async processWebhook(data: ProcessWebhookData) {
    try {
      return await prisma.$transaction((tx) => processWebhookTransaction(tx, data));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return { duplicate: true };
      }
      throw error;
    }
  }
}
