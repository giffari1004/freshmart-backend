import { Router } from "express";
import { customerProductController } from "./product-public-controller";

export const customerProductRoute = Router()
customerProductRoute.get("/",customerProductController.getAllCatalog)