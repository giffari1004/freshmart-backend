import { Router } from "express";
import { VoucherController } from "./voucher-controller";
import { authMiddleware } from "../../../middlewares/auth-middleware";
import { requireRole } from "../../../middlewares/role-middleware";

export const voucherRoute = Router();

voucherRoute.use(authMiddleware, requireRole("SUPER_ADMIN"));
voucherRoute.get("/", VoucherController.getAllVoucher);
voucherRoute.get("/:id", VoucherController.getVoucherById);
voucherRoute.post("/", VoucherController.createVoucher);
voucherRoute.patch("/:id", VoucherController.updateVoucher);
voucherRoute.delete("/:id", VoucherController.deleteVoucher);