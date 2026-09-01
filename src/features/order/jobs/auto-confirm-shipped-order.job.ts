import { OrderAutoConfirmService } from "../services/order.auto-confirm.service";

const JOB_INTERVAL_MS = 60_000;

let timer: NodeJS.Timeout | null = null;

export function startAutoConfirmShippedOrderJob(): void {
  if (timer) {
    return;
  }

  const service = new OrderAutoConfirmService();

  void run(service);

  timer = setInterval(() => {
    void run(service);
  }, JOB_INTERVAL_MS);
}

async function run(
  service: OrderAutoConfirmService,
): Promise<void> {
  try {
    await service.confirmExpiredShippedOrders();
  } catch (error) {
    handleJobError(error);
  }
}

function handleJobError(error: unknown): void {
  if (error instanceof Error) {
    console.error(
      `[AUTO CONFIRM] ${error.message}`,
    );
    return;
  }

  console.error("[AUTO CONFIRM] Job failed");
}