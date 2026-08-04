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
import { categoryRouter } from "./features/category/category.route";

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
app.use('/api/v1/admin' , adminRouter)
app.use('/api/v1/categories', categoryRouter)
app.use((_req, _res, next) => {
  next(new NotFoundError("Endpoint not found"));
});

app.use(ErrorMiddleware);

export default app;
