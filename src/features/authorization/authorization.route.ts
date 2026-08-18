import { Router } from "express";
import { AuthorizationController } from "./authorization.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";

export const authorizationRoute = Router();

authorizationRoute.get(
  "/session",
  authMiddleware,
  AuthorizationController.getSession,
);
