import { Router } from "express";
import { AddressController } from "./address.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";

export const addressRoute = Router();

// Semua route di sini wajib login — resource milik user sendiri (bukan
// admin-only), jadi cukup authMiddleware tanpa requireRole.
addressRoute.use(authMiddleware);

// Taruh SEBELUM "/:id" supaya "cities" tidak ke-capture jadi param :id.
addressRoute.get("/cities", AddressController.searchCities);

addressRoute.get("/", AddressController.getAll);
addressRoute.get("/:id", AddressController.getById);
addressRoute.post("/", AddressController.create);
addressRoute.patch("/:id", AddressController.update);
addressRoute.delete("/:id", AddressController.delete);
addressRoute.patch("/:id/set-primary", AddressController.setPrimary);
addressRoute.post(
  "/:id/shipping-options",
  AddressController.getShippingOptions,
);
