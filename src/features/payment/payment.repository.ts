import { prisma } from "../../configs/prisma-client-config";

export class PaymentRepository {
  async getPaymentForOrder(userId: string, orderId: string) {
    return prisma.payment.findFirst({ where: { orderId, order: { userId } } });
  }
  async updatePaymentGatewayData(
    paymentId: string,
    data: {
      gatewayOrderId: string;
      snapToken: string;
      paymentUrl: string;
      expiredAt: Date;
    },
  ) {
    return prisma.payment.update({ where: { id: paymentId }, data });
  }
}
