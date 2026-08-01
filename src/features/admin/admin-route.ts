import { Router } from "express";
import { AdminController } from "./admin-controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { requireRole } from "../../middlewares/role-middleware";

export const AdminRouter = Router();

// Semua route di folder admin/ ini WAJIB login + role SUPER_ADMIN
AdminRouter.use(authMiddleware, requireRole('SUPER_ADMIN'));
AdminRouter.post('/createAdmin', AdminController.create);
AdminRouter.get('/getAdmin', AdminController.get);
AdminRouter.patch('/updateAdmin/:id', AdminController.update);
AdminRouter.post('/deleteAdmin/:id', AdminController.delete);