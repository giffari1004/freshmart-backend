import z from "zod";

export class DiscountCalculateValidation {
  static readonly CALCULATE_DISCOUNT = z.object({
    body: z.object({
      storeId: z.string().uuid("Invalid store id"),
      cartItems: z
        .array(
          z.object({
            productId: z.string().uuid("Invalid product id"),
            quantity: z.number().int().positive("Quantity must be at least 1"),
            price: z.number().positive("Price must be positive"),
          }),
        )
        .min(1, "Cart items cannot be empty"),
      voucherCode: z.string().min(1).optional(),
    }),
  });
}
export type calculateDiscountSchema = z.infer<
  typeof DiscountCalculateValidation.CALCULATE_DISCOUNT
>;
