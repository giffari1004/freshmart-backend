import { Request, Response, NextFunction } from "express";
import { prisma } from "../configs/prisma-client-config";
import { Forbidden } from "../errors/Forbidden";
import { UnAuthorizedError } from "../errors/UnauthorizedError";

/**
 * Guard untuk aksi yang mensyaratkan email sudah terverifikasi (mis. buat
 * pesanan, tambah ke cart) — dipakai fitur LAIN (Feature 3), bukan
 * endpoint di features/authorization sendiri.
 *
 * Sengaja query ulang ke database, TIDAK mengandalkan `isVerified` dari
 * payload JWT — status verifikasi bisa berubah setelah token diterbitkan
 * (mis. user baru saja verifikasi email di device lain), dan JWT tidak
 * di-refresh otomatis saat itu terjadi.
 *
 * Pasang SETELAH authMiddleware:
 *   router.post("/cart", authMiddleware, requireVerified, controller.add)
 */
export async function requireVerified(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    throw new UnAuthorizedError("You must be logged in");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { isVerified: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new UnAuthorizedError("Account not found");
  }

  if (!user.isVerified) {
    throw new Forbidden("Please verify your email to perform this action");
  }

  next();
}
