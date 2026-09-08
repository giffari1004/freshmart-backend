import dotenv from "dotenv";
import app from "./app";
import { prisma } from "./configs/prisma-client-config";
import cron from "node-cron";
import { startExpireWaitingPaymentJob } from "./features/payment/jobs/expire-waiting-payment.job";
import { startAutoConfirmShippedOrderJob } from "./features/order/jobs/auto-confirm-shipped-order.job";

dotenv.config();
const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  startExpireWaitingPaymentJob();
  startAutoConfirmShippedOrderJob();
});

cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  const result = await prisma.discount.updateMany({
    where: {
      endDate: { lt: now },
      isActive: true,
      deletedAt: null,
    },
    data: { isActive: false },
  });
  console.log(`[CRON] Deactivated ${result.count} expired discounts`);

  const voucherResult = await prisma.voucher.updateMany({
    where: { expiredAt: { lt: now }, isActive: true, deletedAt: null },
    data: { isActive: false },
  });
  console.log(`[CRON] Deactivated ${voucherResult.count} expired vouchers`);
});