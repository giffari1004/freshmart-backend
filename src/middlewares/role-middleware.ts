// import { Request, Response, NextFunction } from "express";
// import { Forbidden } from "../errors/Forbidden";
// import { AuthUser } from "./auth-middleware";

// // Dipakai SETELAH authMiddleware, jadi req.user pasti sudah terisi.
// export function requireRole(...allowedRoles: AuthUser["role"][]) {
//   return (req: Request, _res: Response, next: NextFunction) => {
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       throw new Forbidden("You don't have permission to access this resource");
//     }
//     next();
//   };
// }
import {
  Request,
  Response,
  NextFunction,
} from "express";

import { Forbidden } from "../errors/Forbidden";
import { AuthUser } from "./auth-middleware";

export function requireRole(
  ...allowedRoles: AuthUser["role"][]
) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ) => {
    console.log("[ROLE] req.user:", req.user);
    console.log("[ROLE] current role:", req.user?.role);
    console.log("[ROLE] allowed roles:", allowedRoles);

    if (
      !req.user ||
      !allowedRoles.includes(req.user.role)
    ) {
      console.log("[ROLE] CHECK FAILED");

      throw new Forbidden(
        "You don't have permission to access this resource",
      );
    }

    console.log("[ROLE] CHECK PASSED");

    next();
  };
}
