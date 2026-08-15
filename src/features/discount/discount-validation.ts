import z from "zod";
import { ValueType } from "../../../generated/prisma";

export class DiscountValidation {
  static readonly CREATE_DISCOUNT = z.object({
    body: z
      .object({
        storeId: z.string().uuid("Invalid store id"),
        productId: z.string().uuid("Invalid product id"),
        valueType: z.enum(ValueType),
        value: z.number().positive(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
      .refine((data) => data.endDate > data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
      })
      .refine(
        (data) =>
          data.valueType === "PERCENTAGE" ? data.value <= 100 : true,
        {
          message: "Percentage discount cannot exceed 100",
          path: ["value"],
        },
      ),
  });

  static readonly UPDATE_DISCOUNT = z.object({
    params: z.object({
      id: z.string().uuid("Invalid discount id"),
    }),
    body: z.object({
      valueType: z.enum(ValueType).optional(),
      value: z.number().positive().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
  });

  static readonly DELETE_DISCOUNT = z.object({
    params: z.object({
      id: z.string().uuid("Invalid discount id"),
    }),
  });

  static readonly GET_DISCOUNTS = z.object({
    query: z.object({
      storeId: z.string().uuid("Invalid store id").optional(),
      productId: z.string().uuid("Invalid product id").optional(),
      activeOnly: z.coerce.boolean().default(true),
    }),
  });
}

export type createDiscountSchema = z.infer<
  typeof DiscountValidation.CREATE_DISCOUNT
>;

export type updateDiscountSchema = z.infer<
  typeof DiscountValidation.UPDATE_DISCOUNT
>;

export type deleteDiscountSchema = z.infer<
  typeof DiscountValidation.DELETE_DISCOUNT
>;

export type getDiscountsSchema = z.infer<
  typeof DiscountValidation.GET_DISCOUNTS
>;