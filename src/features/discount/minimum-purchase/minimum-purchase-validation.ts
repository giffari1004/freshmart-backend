import z from "zod";
import { ValueType } from "../../../../generated/prisma";

export class MinimumDiscountValidation {
  static readonly CREATE = z.object({
    body: z
      .object({
        storeId: z.string().uuid("Invalid store id"),
          valueType: z.enum(ValueType),
        value: z.number().positive(),
        minPurchaseAmount: z.number().positive(),
        maxDiscountAmount: z.number().positive().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
      .refine(
        (data) => (data.valueType === "PERCENTAGE" ? data.value <= 100 : true),
        {
          message: "Percentage discount cannot exceed 100",
          path: ["value"],
        },
      )
      .refine((data) => data.endDate > data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
      }),
  });
  static readonly UPDATE = z
    .object({
      params: z.object({
        id: z.string().uuid("Invalid discount id"),
      }),
      body: z.object({
        valueType: z.enum(ValueType).optional(),
        value: z.number().positive().optional(),
        minPurchaseAmount: z.number().positive().optional(),
        maxDiscountAmount: z.number().positive().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    })
    .refine(
      (data) =>
        data.body.valueType === "PERCENTAGE" && data.body.value !== undefined
          ? data.body.value <= 100
          : true,
      {
        message: "Percentage discount cannot exceed 100",
        path: ["body", "value"],
      },
    )
    .refine(
      (data) =>
        data.body.startDate && data.body.endDate
          ? data.body.endDate > data.body.startDate
          : true,
      {
        message: "End date must be after start date",
        path: ["body", "endDate"],
      },
    );

  static readonly DELETE = z.object({
    params: z.object({
      id: z.string().uuid("Invalid discount id"),
    }),
  });
  static readonly GET_MINIMUM_PURCHASE = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      storeId: z.string().uuid("Invalid store id").optional(),
      productId: z.string().uuid("Invalid product id").optional(),
      activeOnly: z.coerce.boolean().default(true),
    }),
  });
}
export type getMinimumPurchaseSchema = z.infer<
  typeof MinimumDiscountValidation.GET_MINIMUM_PURCHASE
>;
export type createMinimumDiscountSchema = z.infer<
  typeof MinimumDiscountValidation.CREATE
>;
export type updateMinimumDiscountSchema = z.infer<
  typeof MinimumDiscountValidation.UPDATE
>;
export type deleteMinimumDiscountSchema = z.infer<
  typeof MinimumDiscountValidation.DELETE
>;
