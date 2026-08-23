import z from "zod";

export class BogoValidation {
  static readonly CREATE = z.object({
    body: z
      .object({
        storeId: z.string().uuid("Invalid store id"),
        productId: z.string().uuid("Invalid product id"),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      })
      .refine((data) => data.endDate > data.startDate, {
        message: "End date must be after start date",
        path: ["endDate"],
      }),
  });

  static readonly UPDATE = z
    .object({
      params: z.object({
        id: z.string().uuid("Invalid BOGO id"),
      }),
      body: z.object({
        productId: z.string().uuid("Invalid product id").optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
    })
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
      id: z.string().uuid("Invalid BOGO id"),
    }),
  });

  static readonly CALCULATE = z.object({
    body: z.object({
      storeId: z.string().uuid("Invalid store id"),
      productId: z.string().uuid("Invalid product id"),
      quantity: z.number().int().positive(),
    }),
  });
}

export type CreateBogoSchema = z.infer<
  typeof BogoValidation.CREATE
>;
export type UpdateBogoSchema = z.infer<
  typeof BogoValidation.UPDATE
>;
export type DeleteBogoSchema = z.infer<
  typeof BogoValidation.DELETE
>;
export type CalculateBogoSchema = z.infer<
  typeof BogoValidation.CALCULATE
>;