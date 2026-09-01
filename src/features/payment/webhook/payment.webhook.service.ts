import { BadRequestError } from "../../../errors/BadRequestError";
import { Prisma } from "../../../../generated/prisma";
import { PaymentWebhookRepository } from "./payment.webhook.repository";
import {
  MidtransWebhookRequest,
  PaymentWebhookResult,
  WebhookStatus,
} from "./payment.webhook.type";
import { verifyMidtransSignature } from "./payment.webhook.util";

export class PaymentWebhookService {
  constructor(
    private readonly paymentWebhookRepository = new PaymentWebhookRepository(),
  ) {}

  async handleWebhook(
    payload: MidtransWebhookRequest,
  ): Promise<PaymentWebhookResult> {
    this.verifyPayload(payload);
    const payment =
      await this.paymentWebhookRepository.findPaymentByGatewayOrderId(
        payload.order_id,
      );
    if (!payment) throw new BadRequestError("Payment not found");
    if (await this.isDuplicate(payload))
      return { success: true, message: "Webhook already processed" };
    await this.processPayment(
      payment.id,
      payment.orderId,
      payload,
      this.mapPaymentStatus(payload.transaction_status),
    );
    return { success: true, message: "Payment webhook processed successfully" };
  }

  private verifyPayload(payload: MidtransWebhookRequest) {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY is not configured");
    if (
      !verifyMidtransSignature(
        payload.order_id,
        payload.status_code,
        payload.gross_amount,
        payload.signature_key,
        serverKey,
      )
    )
      throw new BadRequestError("Invalid Midtrans signature");
  }

  private async isDuplicate(payload: MidtransWebhookRequest) {
    return Boolean(
      await this.paymentWebhookRepository.findWebhookEvent(
        payload.order_id,
        payload.transaction_id ?? null,
        payload.transaction_status,
      ),
    );
  }

  private async processPayment(
    paymentId: string,
    orderId: string,
    payload: MidtransWebhookRequest,
    status: WebhookStatus,
  ) {
    await this.paymentWebhookRepository.processWebhook(
      buildWebhookData(paymentId, orderId, payload, status),
    );
  }

  private mapPaymentStatus(transactionStatus: string): WebhookStatus {
    const statuses: Record<string, WebhookStatus> = {
      settlement: {
        paymentStatus: "SETTLEMENT",
        orderStatus: "WAITING_CONFIRMATION",
        releaseStock: false,
      },
      expire: {
        paymentStatus: "EXPIRED",
        orderStatus: "CANCELLED",
        releaseStock: true,
      },
      deny: {
        paymentStatus: "DENIED",
        orderStatus: "CANCELLED",
        releaseStock: true,
      },
      cancel: {
        paymentStatus: "CANCELLED",
        orderStatus: "CANCELLED",
        releaseStock: true,
      },
    };
    const status = statuses[transactionStatus];
    if (!status)
      throw new BadRequestError(
        `Unsupported transaction status: ${transactionStatus}`,
      );
    return status;
  }
}


function buildWebhookData(
  paymentId: string,
  orderId: string,
  payload: MidtransWebhookRequest,
  status: WebhookStatus,
) {
  return {
    paymentId, orderId, transactionId: payload.transaction_id ?? null,
    transactionStatus: payload.transaction_status, statusCode: payload.status_code,
    grossAmount: Number(payload.gross_amount), signatureKey: payload.signature_key,
    payload: payload as unknown as Prisma.InputJsonValue, ...status,
  };
}
