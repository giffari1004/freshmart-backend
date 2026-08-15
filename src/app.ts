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
import { discountRoute } from "./features/discount/discount-route";
import { discountPublicRoute } from "./features/discount/discount-public-route";


const app = express();

// ===============================
// Security & Global Middleware
// ===============================

app.use(helmet());

app.use(
  cors({
    origin: WHITE_LIST,
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(express.json());

app.use(cookieParser());

// ===============================
// Rate Limiter
// ===============================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// ===============================
// Health Check
// ===============================

app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API is running",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// Routes
// ===============================

app.use("/api/v1/admin", adminRouter);

app.use("/api/v1/categories", categoryRouter);

app.use("/api/v1/admin/products", productRoute);

app.use("/api/v1/products", customerProductRoute);

// ===============================
// Feature 3 - Cart
// ===============================

app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/cart", cartRouter);

// ===============================
// Feature 4 - Order
// ===============================

app.use("/api/v1/orders", orderRouter);
app.use(
  "/api/v1/payments",
  paymentRouter,
);
app.use("/api/v1/storefront", storefrontRoute);
app.use("/api/v1/stores", storeRoute);
app.use("/api/v1/auth", authRoute);
app.use('/api/v1/admin/discounts', discountRoute);   
app.use('/api/v1/discounts', discountPublicRoute);       
// ===============================
// 404 Handler
// ===============================

app.use((_req, _res, next) => {
  next(new NotFoundError("Endpoint not found"));
});

// ===============================
// Global Error Handler
// ===============================

app.use(ErrorMiddleware.handle);

export default app;
