import { PaymentExpiryService } from "../payment.expiry.service"

const INTERVAL_MS = 60_000;

let interval: NodeJS.Timeout | null = null;

export function startExpireWaitingPaymentJob(): void {
  if (interval) {
    return;
  }

  const service = new PaymentExpiryService();

  const run = async (): Promise<void> => {
    try {
      const count =
        await service.expireWaitingPayments();

      logExpiredOrders(count);
    } catch {
      logExpiryFailure();
    }
  };

  void run();

  interval = setInterval(() => {
    void run();
  }, INTERVAL_MS);
}

function logExpiredOrders(count: number): void {
  if (count === 0) {
    return;
  }

  console.info(
    `[PAYMENT EXPIRY] Expired ${count} waiting payment order(s)`,
  );
}

function logExpiryFailure(): void {
  console.error(
    "[PAYMENT EXPIRY] Failed to process expired payments",
  );
}