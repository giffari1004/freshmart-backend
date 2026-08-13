import { BadRequestError } from "../../../errors/BadRequestError";

import { PaymentWebhookRepository } from "./payment.webhook.repository";

import {
  MidtransWebhookRequest,
  PaymentWebhookResult,
} from "./payment.webhook.type";

import { verifyMidtransSignature } from "./payment.webhook.util";
import { Prisma } from "../../../../generated/prisma";

export class PaymentWebhookService {
  constructor(
    private readonly paymentWebhookRepository = new PaymentWebhookRepository(),
  ) {}

  async handleWebhook(
    payload: MidtransWebhookRequest,
  ): Promise<PaymentWebhookResult> {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (!serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY is not configured");
    }

    const isValid = verifyMidtransSignature(
      payload.order_id,
      payload.status_code,
      payload.gross_amount,
      payload.signature_key,
      serverKey,
    );

    if (!isValid) {
      throw new BadRequestError("Invalid Midtrans signature");
    }

    const payment =
      await this.paymentWebhookRepository.findPaymentByGatewayOrderId(
        payload.order_id,
      );

    if (!payment) {
      throw new BadRequestError("Payment not found");
    }

    const existingEvent = await this.paymentWebhookRepository.findWebhookEvent(
      payload.order_id,
      payload.transaction_id ?? null,
      payload.transaction_status,
    );

    if (existingEvent) {
      return {
        success: true,
        message: "Webhook already processed",
      };
    }

    const result = this.mapPaymentStatus(payload.transaction_status);

    await this.paymentWebhookRepository.processWebhook({
      paymentId: payment.id,

      orderId: payment.orderId,

      transactionId: payload.transaction_id ?? null,

      transactionStatus: payload.transaction_status,

      statusCode: payload.status_code,

      grossAmount: Number(payload.gross_amount),

      signatureKey: payload.signature_key,

      payload: payload as unknown as Prisma.InputJsonValue,

      paymentStatus: result.paymentStatus,

      orderStatus: result.orderStatus,

      releaseStock: result.releaseStock,
    });

    return {
      success: true,
      message: "Payment webhook processed successfully",
    };
  }

  private mapPaymentStatus(transactionStatus: string) {
    switch (transactionStatus) {
      case "settlement":
        return {
          paymentStatus: "SETTLEMENT" as const,

          orderStatus: "PAID" as const,

          releaseStock: false,
        };

      case "expire":
        return {
          paymentStatus: "EXPIRED" as const,

          orderStatus: "CANCELLED" as const,

          releaseStock: true,
        };

      case "deny":
        return {
          paymentStatus: "DENIED" as const,

          orderStatus: "CANCELLED" as const,

          releaseStock: true,
        };

      case "cancel":
        return {
          paymentStatus: "CANCELLED" as const,

          orderStatus: "CANCELLED" as const,

          releaseStock: true,
        };

      default:
        throw new BadRequestError(
          `Unsupported transaction status: ${transactionStatus}`,
        );
    }
  }
}
