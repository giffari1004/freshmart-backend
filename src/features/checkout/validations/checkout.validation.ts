import z from "zod";

export const checkoutPreviewSchema = z.object({
  addressId: z.string().uuid("Invalid address id"),
  shippingMethodId: z.string().uuid("Invalid shipping method id"),
  userVoucherId: z.string().uuid("Invalid user voucher id").optional(),
});

export const checkoutVouchersQuerySchema = z.object({
  storeId: z.string().uuid("Invalid store id").optional(),
});

export const checkoutShippingOptionsQuerySchema = z.object({
  addressId: z.string().uuid("Invalid address id"),
});

export type CheckoutPreviewDto = z.infer<typeof checkoutPreviewSchema>;
export type CheckoutVouchersQuery = z.infer<typeof checkoutVouchersQuerySchema>;
export type CheckoutShippingOptionsQuery = z.infer<
  typeof checkoutShippingOptionsQuerySchema
>;
