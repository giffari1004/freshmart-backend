import z from "zod";

export class DiscountUsageValidation {
  static readonly GET_ALL_USAGE = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      storeId: z.string().uuid().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      sortBy: z.enum(["createdAt", "amountDeducted"]).default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  });
}

export type getAllUsageSchema = z.infer<typeof DiscountUsageValidation.GET_ALL_USAGE>;