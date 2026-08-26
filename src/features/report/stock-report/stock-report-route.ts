import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { StockReportController } from "./stock-report-controller";

export const stockReportRoute = Router();
stockReportRoute.use(authMiddleware);
stockReportRoute.use(requireRole("STORE_ADMIN","SUPER_ADMIN"));
stockReportRoute.get("/summary",StockReportController.getMonthlySummary);
stockReportRoute.get("/detail",StockReportController.getStockDetail);
