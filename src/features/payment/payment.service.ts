import { BadRequestError } from "../../errors/BadRequestError";
import { NotFoundError } from "../../errors/NotFoundError";
import { snap } from "../../configs/midtrans-client-configs";
import { PaymentRepository } from "./payment.repository";
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
} from "./payment.type";

type PaymentRecord = NonNullable<
  Awaited<ReturnType<PaymentRepository["getPaymentForOrder"]>>
>;

interface MidtransTransaction {
  token: string;
  redirect_url: string;
}

export class PaymentService {
  constructor(
    private readonly paymentRepository = new PaymentRepository(),
  ) {}

  async createPayment(
    userId: string,
    payload: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    const payment = await this.getPendingPayment(
      userId,
      payload.orderId,
    );

    if (payment.snapToken) {
      return this.toResponse(payment);
    }

    return this.createGatewayPayment(payment);
  }

  private async createGatewayPayment(
    payment: PaymentRecord,
  ): Promise<CreatePaymentResponse> {
    const transaction = await this.createMidtransTransaction(payment);
    const updated = await this.saveGatewayData(payment, transaction);

    return this.toResponse(updated);
  }

  private createMidtransTransaction(
    payment: PaymentRecord,
  ): Promise<MidtransTransaction> {
    return snap.createTransaction({
      transaction_details: {
        order_id: payment.gatewayOrderId!,
        gross_amount: Number(payment.amount),
      },
    });
  }

  private async saveGatewayData(
    payment: PaymentRecord,
    transaction: MidtransTransaction,
  ) {
    const expiredAt = payment.expiredAt;

    if (!expiredAt) {
      throw new BadRequestError(
        "Payment expiry is not configured",
      );
    }

    return this.paymentRepository.updatePaymentGatewayData(
      payment.id,
      {
        gatewayOrderId: payment.gatewayOrderId!,
        snapToken: transaction.token,
        paymentUrl: transaction.redirect_url,
        expiredAt,
      },
    );
  }

  private async getPendingPayment(
    userId: string,
    orderId: string,
  ): Promise<PaymentRecord> {
    const payment =
      await this.paymentRepository.getPaymentForOrder(
        userId,
        orderId,
      );

    this.validatePayment(payment);
    return payment;
  }

  private validatePayment(
    payment: PaymentRecord | null,
  ): asserts payment is PaymentRecord {
    if (!payment) {
      throw new NotFoundError("Payment not found");
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestError(
        "Payment is no longer available",
      );
    }

    if (!payment.gatewayOrderId) {
      throw new BadRequestError(
        "Payment gateway order ID is not available",
      );
    }
  }

  private toResponse(
    payment: PaymentRecord,
  ): CreatePaymentResponse {
    return {
      orderId: payment.orderId,
      paymentId: payment.id,
      snapToken: payment.snapToken ?? "",
      paymentUrl: payment.paymentUrl ?? "",
    };
  }
}