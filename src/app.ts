import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { WHITE_LIST } from "./configs/env-config";
import { ErrorMiddleware } from "./middlewares/error-middleware";
import { NotFoundError } from "./errors/NotFoundError";
import { adminRouter } from "./features/admin/admin-route";
import cartRouter from "./features/cart/cart.route";
import { categoryRouter } from "./features/category/category-route";
import { productRoute } from "./features/product/product-route";
import { customerProductRoute } from "./features/product/product-public-route";
import checkoutRouter from "./features/checkout/route/checkout.route";
import orderRouter from "./features/order/route/order.route";
import paymentRouter from "./features/payment/payment.route";
import { storefrontRoute } from "./features/storefront/storefront.route";
import { storeRoute } from "./features/store/store.route";
import { authRoute } from "./features/auth/auth.route";
import { discountRoute } from "./features/discount/direct/discount-route";
import { minimumPurchaseDiscountRoute } from "./features/discount/minimum-purchase/minimum-purchase-route";
import { bogoRoute } from "./features/discount/bogo/bogo-route";
import { bogoPublicRoute } from "./features/discount/bogo/bogo-public-route";
import { addressRoute } from "./features/address/address.routes";
import { profileRoute } from "./features/profile/profile.route";
import { authorizationRoute } from "./features/authorization/authorization.route";
import { socialLoginRoute } from "./features/social-login/social-login.route";
import { discountCalculateRoute } from "./features/discount/calculate/discount-calculate-route";
import { discountUsageRoute } from "./features/discount/usage/discount-usage-route";
import { salesReportRoute } from "./features/report/sales-report/sales-report-route";
import { stockReportRoute } from "./features/report/stock-report/stock-report-route";
import orderAdminRouter from "./features/order/admin/order-admin.route";
import { inventoryRoute } from "./features/inventory/inventory-route";
import { voucherPublicRoute } from "./features/discount/voucher/vourcher-public-route";
import { voucherRoute } from "./features/discount/voucher/voucher-route";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: WHITE_LIST,
    credentials: true,
  }),
)
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/admin/products", productRoute);
app.use("/api/v1/products", customerProductRoute);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/storefront", storefrontRoute);
app.use("/api/v1/stores", storeRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/admin/orders", orderAdminRouter);
app.use("/api/v1/inventory", inventoryRoute);
app.use("/api/v1/addresses", addressRoute);
app.use("/api/v1/profile", profileRoute);
app.use("/api/v1/authorization", authorizationRoute);
app.use("/api/v1/social-login", socialLoginRoute);
app.use("/api/v1/reports/sales", salesReportRoute);
app.use("/api/v1/reports/stock", stockReportRoute);
app.use("/api/v1/admin/vouchers", voucherRoute);
app.use("/api/v1/admin/discounts/minimum-purchase", minimumPurchaseDiscountRoute);
app.use("/api/v1/discounts/calculate", discountCalculateRoute);
app.use("/api/v1/discounts/usage", discountUsageRoute);
app.use('/api/v1/admin/bogo', bogoRoute);
app.use('/api/v1/bogo', bogoPublicRoute);
app.use("/api/v1/vouchers", voucherPublicRoute); 
app.use("/api/v1/admin/discounts", discountRoute);

app.use((_req, _res, next) => {
  next(new NotFoundError("Endpoint not found"));
});
app.use(ErrorMiddleware.handle);

export default app;