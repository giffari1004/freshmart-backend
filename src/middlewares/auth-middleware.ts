import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnAuthorizedError } from "../errors/UnauthorizedError";
import { JWT_SECRET } from "../configs/env-config";

export interface AuthUser {
  id: string;
  role: "CUSTOMER" | "STORE_ADMIN" | "SUPER_ADMIN";
  storeId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnAuthorizedError("Token tidak ditemukan");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnAuthorizedError("Token tidak ditemukan");
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as unknown as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new UnAuthorizedError("Token tidak valid atau kedaluwarsa");
  }
}
