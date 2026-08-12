import { BadRequestError } from "../../errors/BadRequestError";
import { NotFoundError } from "../../errors/NotFoundError";
import { snap } from "../../configs/midtrans-client-configs";
import { PaymentRepository } from "./payment.repository";
import { CreatePaymentRequest, CreatePaymentResponse } from "./payment.type";

export class PaymentService {
  constructor(private readonly paymentRepository = new PaymentRepository()) {}

  async createPayment(
    userId: string,
    payload: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const payment = await this.paymentRepository.getPaymentForOrder(
      userId,
      payload.orderId,
    );

    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestError("Payment is no longer available");
    }

    if (payment.snapToken) {
      return {
        orderId: payment.orderId,

        paymentId: payment.id,

        snapToken: payment.snapToken,

        paymentUrl: payment.paymentUrl ?? "",
      };
    }

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: payment.gatewayOrderId,

        gross_amount: Number(payment.order.totalAmount),
      },
    });

    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updatedPayment =
      await this.paymentRepository.updatePaymentGatewayData(payment.id, {
        gatewayOrderId: payment.gatewayOrderId,

        snapToken: transaction.token,

        paymentUrl: transaction.redirect_url,

        expiredAt,
      });

    return {
      orderId: updatedPayment.orderId,

      paymentId: updatedPayment.id,

      snapToken: updatedPayment.snapToken ?? "",

      paymentUrl: updatedPayment.paymentUrl ?? "",
    };
  }
}
