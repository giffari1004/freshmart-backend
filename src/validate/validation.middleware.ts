import { RequestHandler } from "express";
import { ZodType } from "zod";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ success: false, message: "Invalid request", errors: result.error.flatten() });
    req.body = result.data;
    next();
  };
}
