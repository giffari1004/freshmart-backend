import { z } from "zod";

export const addToCartSchema = z.object({
  storeProductId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const updateCartSchema = z.object({
  quantity: z.number().int().positive(),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;
export type UpdateCartDto = z.infer<typeof updateCartSchema>;