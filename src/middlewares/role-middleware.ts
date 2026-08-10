import { Request, Response, NextFunction } from "express";
import { Forbidden } from "../errors/Forbidden";
import { AuthUser } from "./auth-middleware";

// Dipakai SETELAH authMiddleware, jadi req.user pasti sudah terisi.
export function requireRole(...allowedRoles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new Forbidden("You don't have permission to access this resource");
    }
    next();
  };
}
