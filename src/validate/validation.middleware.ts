import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export const validateBody =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: result.error.flatten(),
      });
    }

    res.locals.validatedBody = result.data;

    return next();
  };

export const validateQuery =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: result.error.flatten(),
      });
    }

    res.locals.validatedQuery = result.data;

    return next();
  };

export const validateParams =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: result.error.flatten(),
      });
    }

    res.locals.validatedParams = result.data;

    return next();
  };