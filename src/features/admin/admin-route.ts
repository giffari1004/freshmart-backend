import { Router } from "express";
import { AdminController } from "./admin-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const adminRouter = Router();

adminRouter.use(authMiddleware, requireRole('SUPER_ADMIN'));
adminRouter.get('/users', AdminController.getAllUser);
adminRouter.post('/store-admins', AdminController.create);
adminRouter.patch('/store-admins/:id', AdminController.update);
adminRouter.delete('/store-admins/:id', AdminController.delete);