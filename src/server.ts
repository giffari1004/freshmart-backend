import dotenv from "dotenv";
import app from "./app";
import {
  startExpireWaitingPaymentJob,
} from "./features/payment/jobs/expire-waiting-payment.job";
import {
  startAutoConfirmShippedOrderJob,
} from "./features/order/jobs/auto-confirm-shipped-order.job";

dotenv.config();

const PORT = process.env.PORT || 8001;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);

  startExpireWaitingPaymentJob();
 startAutoConfirmShippedOrderJob();
});