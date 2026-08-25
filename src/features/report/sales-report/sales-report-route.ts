import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";
import { SalesReportController } from "./sales-report-controller";
export const salesReportRoute = Router()
salesReportRoute.use(authMiddleware)
salesReportRoute.use(requireRole("STORE_ADMIN","SUPER_ADMIN"))
salesReportRoute.get("/monthly", SalesReportController.getMonthlyReport)
salesReportRoute.get("/product", SalesReportController.getProductReport)
salesReportRoute.get("/category", SalesReportController.getCategoryReport)
