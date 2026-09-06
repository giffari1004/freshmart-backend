import { Router } from "express";
import { ProfileController } from "./profile.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";
import { upload } from "../../middlewares/upload-middleware";

export const profileRoute = Router();

// Semua route wajib login — ini resource "diri sendiri", tidak perlu
// requireRole karena semua role (customer/store_admin/super_admin)
// sama-sama punya profile sendiri.
profileRoute.use(authMiddleware);

profileRoute.get("/", ProfileController.getProfile);
profileRoute.patch("/", ProfileController.updateProfile);
profileRoute.patch(
  "/avatar",
  upload.single("avatar"),
  ProfileController.updateAvatar,
);
profileRoute.patch("/email", ProfileController.updateEmail);
profileRoute.patch("/password", ProfileController.updatePassword);
