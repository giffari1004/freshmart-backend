import z from "zod";

export const checkoutPreviewSchema = z.object({
  body: z.object({
    addressId: z.string().uuid("inavlid address id"),

    shippingMethodId: z.string().uuid("invalid shipping method id"),

    userVoucherId: z.string().uuid("invalid user voucher id").optional(),
  }),
});

export type CheckoutPreviewDto = z.infer<typeof checkoutPreviewSchema>;
