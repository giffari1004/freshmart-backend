import z from "zod";

export class StockReportValidation {
  static readonly GET_MONTHLY_SUMMARY = z.object({
    query: z.object({
      storeId: z.string().uuid("Invalid store ID").optional(),
      year: z.coerce.number().int().min(2026).optional(),
      month: z.coerce.number().int().min(1).max(12).optional(),
    }),
  });
  static readonly GET_STOCK_DETAIL = z.object({
    query: z.object({
      storeId: z.string().uuid("Invalid store ID").optional(),
      productId: z.string().uuid("Invalid product ID").optional(),
      year: z.coerce.number().int().min(2026),
      month: z.coerce.number().int().min(1).max(12),
    }),
  });
}
export type getMonthlySummarySchema = z.infer<typeof StockReportValidation.GET_MONTHLY_SUMMARY>;
export type getStockDetailSchema = z.infer<typeof StockReportValidation.GET_STOCK_DETAIL>;