import { z } from "zod";

export type AdminOrderStatus =
  | "PROCESSED"
  | "SHIPPED"
  | "CANCELLED";

export const orderAdminStatusSchema = z.enum([
  "PROCESSED",
  "SHIPPED",
  "CANCELLED",
]);

export const orderAdminListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: z.enum([
      "WAITING_PAYMENT",
      "PAID",
      "PROCESSED",
      "SHIPPED",
      "CONFIRMED",
      "CANCELLED",
    ]).optional(),
    storeId: z.string().uuid().optional(),
    sortBy: z.enum([
      "createdAt",
      "totalAmount",
      "orderNumber",
      "status",
    ]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

export const orderAdminUpdateSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({ status: orderAdminStatusSchema }),
});

export type OrderAdminListInput =
  z.infer<typeof orderAdminListSchema>;

export type OrderAdminUpdateInput =
  z.infer<typeof orderAdminUpdateSchema>;