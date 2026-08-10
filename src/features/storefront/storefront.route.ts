import { Router } from "express";
import { StorefrontController } from "./storefront.controller";

export const storefrontRoute = Router();

// Semua route di bawah ini SENGAJA tidak dipasang authMiddleware —
// landing page harus bisa diakses guest/user yang belum login.
//
// Catatan: endpoint list produk per toko SENGAJA tidak ada di sini —
// itu sudah dikerjakan Feature 2 lewat GET /products (features/product,
// product-public-route.ts). Landing page cukup konsumsi endpoint itu,
// tidak perlu query terpisah dari sisi Feature 1.
storefrontRoute.get("/stores/nearest", StorefrontController.getNearestStore);
storefrontRoute.get("/categories", StorefrontController.getCategories);
storefrontRoute.get("/promotions", StorefrontController.getPromotions);
