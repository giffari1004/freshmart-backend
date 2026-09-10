import z from "zod";
import { ValueType, VoucherUsageType } from "../../../../generated/prisma";

export default class VoucherValidation {
  static readonly CREATE_VOUCHER = z.object({
    body: z
      .object({
        storeId: z.string().uuid("Invalid store id").optional(),
        code: z.string().min(1, "Voucher code is required"),
        usageType: z.enum(VoucherUsageType),
        valueType: z.enum(ValueType),
        value: z.number().positive("Value must be greater than 0"),
        maxDiscountAmount: z.number().positive().optional(),
        minPurchaseAmount: z.number().positive().optional(),
        productId: z.string().uuid("Invalid product id").optional(),
        expiredAt: z.coerce.date(),
        isActive: z.boolean().optional(),
      })
      .refine(
        (data) => (data.valueType === "PERCENTAGE" ? data.value <= 100 : true),
        {
          message: "Percentage voucher cannot exceed 100",
          path: ["value"],
        },
      )
      .refine(
        (data) =>
          data.valueType === "PERCENTAGE"
            ? data.maxDiscountAmount !== undefined
            : true,
        {
          message: "Max discount amount is required for percentage voucher",
          path: ["maxDiscountAmount"],
        },
      )
      .refine(
        (data) =>
          data.usageType === "PRODUCT_SPECIFIC"
            ? data.productId !== undefined
            : true,
        {
          message: "Product is required for PRODUCT_SPECIFIC voucher",
          path: ["productId"],
        },
      ),
  });

  static readonly UPDATE_VOUCHER = z.object({
    params: z.object({
      id: z.string().uuid("Invalid voucher id"),
    }),
    body: z
      .object({
        code: z.string().min(1).optional(),
        usageType: z.enum(VoucherUsageType).optional(),
        valueType: z.enum(ValueType).optional(),
        value: z.number().positive().optional(),
        maxDiscountAmount: z.number().positive().optional(),
        minPurchaseAmount: z.number().positive().optional(),
        productId: z.string().uuid("Invalid product id").optional(),
        expiredAt: z.coerce.date().optional(),
        isActive: z.boolean().optional(),
      })
      .refine(
        (data) =>
          data.valueType === "PERCENTAGE" && data.value !== undefined
            ? data.value <= 100
            : true,
        {
          message: "Percentage voucher cannot exceed 100",
          path: ["value"],
        },
      )
      .refine(
        (data) =>
          data.valueType === "PERCENTAGE"
            ? data.maxDiscountAmount !== undefined
            : true,
        {
          message: "Max discount amount is required for percentage voucher",
          path: ["maxDiscountAmount"],
        },
      )
      .refine(
        (data) =>
          data.usageType === "PRODUCT_SPECIFIC"
            ? data.productId !== undefined
            : true,
        {
          message: "Product is required for PRODUCT_SPECIFIC voucher",
          path: ["productId"],
        },
      ),
  });

  static readonly GET_ALL_VOUCHER = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      storeId: z.string().uuid("Invalid store id").optional(),
      search: z.string().optional(),
      usageType: z.enum(VoucherUsageType).optional(),
      valueType: z.enum(ValueType).optional(),
      sortBy: z.enum(["createdAt", "expiredAt", "value"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  });

  static readonly VOUCHER_ID_PARAM = z.object({
    params: z.object({
      id: z.string().uuid("Invalid voucher id"),
    }),
  });

  static readonly VOUCHER_CODE = z.object({
    params: z.object({
      code: z.string().min(1),
    }),
  });
}

export type getVourcherCodeIdSchema = z.infer<
  typeof VoucherValidation.VOUCHER_CODE
>;
export type getAllVourcherSchema = z.infer<
  typeof VoucherValidation.GET_ALL_VOUCHER
>;
export type createVourcherSchema = z.infer<
  typeof VoucherValidation.CREATE_VOUCHER
>;
export type updateVourcherSchema = z.infer<
  typeof VoucherValidation.UPDATE_VOUCHER
>;
export type VourcherByIdSchema = z.infer<
  typeof VoucherValidation.VOUCHER_ID_PARAM
>;
