import { BadRequestError } from "../../errors/BadRequestError";
import { NotFoundError } from "../../errors/NotFoundError";
import { snap } from "../../configs/midtrans-client-configs";
import { PaymentRepository } from "./payment.repository";
import { Prisma } from "../../../generated/prisma";
import { CreatePaymentRequest, CreatePaymentResponse } from "./payment.type";

type PaymentRecord = NonNullable<
  Awaited<ReturnType<PaymentRepository["getPaymentForOrder"]>>
>;

export class PaymentService {
  constructor(private readonly paymentRepository = new PaymentRepository()) {}

  async createPayment(
    userId: string,
    payload: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const payment = await this.getPendingPayment(userId, payload.orderId);
    if (payment.snapToken) return this.toResponse(payment);
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: payment.gatewayOrderId!,
        gross_amount: Number(payment.amount),
      },
    });
    const expiredAt =
      payment.expiredAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    const updated = await this.paymentRepository.updatePaymentGatewayData(
      payment.id,
      {
        gatewayOrderId: payment.gatewayOrderId!,
        snapToken: transaction.token,
        paymentUrl: transaction.redirect_url,
        expiredAt,
      },
    );
    return this.toResponse(updated);
  }

  private async getPendingPayment(userId: string, orderId: string) {
    const payment = await this.paymentRepository.getPaymentForOrder(
      userId,
      orderId,
    );
    if (!payment) throw new NotFoundError("Payment not found");
    if (payment.status !== "PENDING")
      throw new BadRequestError("Payment is no longer available");
    if (!payment.gatewayOrderId)
      throw new BadRequestError("Payment gateway order ID is not available");
    return payment;
  }

  private toResponse(payment: PaymentRecord): CreatePaymentResponse {
    return {
      orderId: payment.orderId,
      paymentId: payment.id,
      snapToken: payment.snapToken ?? "",
      paymentUrl: payment.paymentUrl ?? "",
    };
  }
}
