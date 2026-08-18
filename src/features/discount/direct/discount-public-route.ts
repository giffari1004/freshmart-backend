import { Router } from "express";
import { DiscountController } from "./discount-controller";

export const discountPublicRoute = Router();
discountPublicRoute.get("/", DiscountController.getAll);
