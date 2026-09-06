import z from "zod";

export class SalesReportValidation {
    static readonly GET_MONTHLY_REPORT = z.object({
        query: z.object({
            storeId: z.string().uuid("Invalid store ID").optional(),
            year: z.coerce.number().int().min(2026).optional()
        })
    })
    static readonly GET_PRODUCT_REPORT = z.object({
        query: z.object({
            storeId: z.string().uuid("Invalid store ID").optional(),
            year: z.coerce.number().int().min(2026).optional(),
            month: z.coerce.number().int().min(1).max(12).optional()
        })
    })
    static readonly GET_CATEGORY_REPORT = z.object({
        query: z.object({
            storeId: z.string().uuid("Invalid store ID").optional(),
            year: z.coerce.number().int().min(2026).optional(),
            month: z.coerce.number().int().min(1).max(12).optional()
        })
    })
}
export type getMonthlyReportSchema = z.infer<typeof SalesReportValidation.GET_MONTHLY_REPORT>
export type getProductReportSchema = z.infer<typeof SalesReportValidation.GET_PRODUCT_REPORT>
export type getCategoryReportSchema = z.infer<typeof SalesReportValidation.GET_CATEGORY_REPORT>