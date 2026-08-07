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
import checkoutrouter from "./features/checkout/route/checkout.route";
const app = express();

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

// Routes
// app.use('/api/products', ProductRoutes);
// app.use('/api/auth', AuthRoutes);

// Routes
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/admin/products", productRoute);
app.use("/api/v1/products", customerProductRoute);

// Feature 3 - Cart
app.use("/api/v1/checkout", checkoutrouter);
app.use("/api/v1/cart", cartRouter);
app.use((_req, _res, next) => {
  next(new NotFoundError("Endpoint not found"));
});

app.use(ErrorMiddleware.handle);

export default app;
