import { prisma } from "../../../configs/prisma-client-config";
import { Prisma } from "../../../../generated/prisma";

export class PaymentWebhookRepository {
  async findPaymentByGatewayOrderId(gatewayOrderId: string) {
    return prisma.payment.findFirst({
      where: {
        gatewayOrderId,
      },
      include: {
        order: true,
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
    });
  }

  async processWebhook(data: {
    paymentId: string;
    orderId: string;

    transactionId: string | null;
    transactionStatus: string;
    statusCode: string;
    grossAmount: number;
    signatureKey: string;

    payload: Prisma.InputJsonValue;

    paymentStatus: "SETTLEMENT" | "EXPIRED" | "DENIED" | "CANCELLED";

    orderStatus: "PAID" | "CANCELLED";

    releaseStock: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const existingEvent = await tx.paymentWebhookEvent.findFirst({
        where: {
          orderId: data.orderId,
          transactionId: data.transactionId,
          transactionStatus: data.transactionStatus,
        },
      });

      if (existingEvent) {
        return {
          duplicate: true,
        };
      }

      const payment = await tx.payment.findUnique({
        where: {
          id: data.paymentId,
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      await tx.payment.update({
        where: {
          id: data.paymentId,
        },
        data: {
          status: data.paymentStatus,

          gatewayTransactionId: data.transactionId,

          paidAt:
            data.paymentStatus === "SETTLEMENT" ? new Date() : payment.paidAt,
        },
      });

      await tx.order.update({
        where: {
          id: data.orderId,
        },
        data: {
          status: data.orderStatus,
        },
      });

      if (data.releaseStock) {
        const orderItems = await tx.orderItem.findMany({
          where: {
            orderId: data.orderId,
          },
        });

        for (const item of orderItems) {
          await tx.$executeRaw`
              UPDATE "store_products"
              SET
                "reservedStock" =
                  GREATEST(
                    "reservedStock" -
                    ${item.quantity},
                    0
                  )
              WHERE
                "id" = ${item.productId}
            `;
        }
      }

      await tx.paymentWebhookEvent.create({
        data: {
          paymentId: data.paymentId,

          orderId: data.orderId,

          transactionId: data.transactionId,

          transactionStatus: data.transactionStatus,

          statusCode: data.statusCode,

          grossAmount: data.grossAmount,

          signatureKey: data.signatureKey,

          payload: data.payload,

          isValid: true,

          processedAt: new Date(),
        },
      });

      return {
        duplicate: false,
      };
    });
  }
}
