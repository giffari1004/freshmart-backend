import { Router } from "express";
import { BogoController } from "./bogo-controller";

export const bogoPublicRoute = Router();

bogoPublicRoute.post("/calculate", BogoController.calculate);