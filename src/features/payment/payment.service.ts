import { BadRequestError } from "../../errors/BadRequestError";

import { snap } from "../../configs/midtrans-client-configs";

import {
  CreatePaymentRequest,
  CreatePaymentResponse,
} from "./payment.type";

export class PaymentService {
  async createPayment(
    payload: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    if (!payload.orderId) {
      throw new BadRequestError(
        "Order ID is required",
      );
    }

    if (payload.grossAmount <= 0) {
      throw new BadRequestError(
        "Payment amount must be greater than zero",
      );
    }

    const transaction =
      await snap.createTransaction({
        transaction_details: {
          order_id:
            payload.orderId,

          gross_amount:
            payload.grossAmount,
        },
      });

    return {
      orderId:
        payload.orderId,

      snapToken:
        transaction.token,

      paymentUrl:
        transaction.redirect_url,
    };
  }
}