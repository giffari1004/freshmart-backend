import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z
    .string()
    .uuid(),

  shippingMethodId: z
    .string()
    .uuid(),

  userVoucherId: z
    .string()
    .uuid()
    .optional(),
});

export type CreateOrderInput =
  z.infer<typeof createOrderSchema>;