import { Router } from "express";
import { AddressController } from "./address.controller";
import { authMiddleware } from "../../middlewares/auth-middleware";

export const addressRoute = Router();

addressRoute.use(authMiddleware);
addressRoute.get("/cities", AddressController.searchCities);
addressRoute.get("/geocode", AddressController.geocodeCity);
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
