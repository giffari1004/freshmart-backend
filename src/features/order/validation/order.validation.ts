import { z } from "zod";
import {
  ORDER_LIST_SORT_FIELDS,
  ORDER_LIST_SORT_ORDERS,
  ORDER_LIST_STATUS_VALUES,
} from "../order.type";

export const createOrderSchema = z.object({
  addressId: z.string().uuid(),

  shippingMethodId: z.string().uuid(),

  userVoucherId: z.string().uuid().optional(),
});



export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z
    .enum([
      "WAITING_PAYMENT",
      "PAID",
      "WAITING_CONFIRMATION",
      "PROCESSED",
      "SHIPPED",
      "CONFIRMED",
      "CANCELLED",
    ])
    .optional(),

  orderNumber: z.string().trim().min(1).max(50).optional(),

  fromDate: z.string().date().optional(),

  toDate: z.string().date().optional(),

  sortBy: z
    .enum([
      "createdAt",
      "totalAmount",
      "orderNumber",
      "status",
    ])
    .default("createdAt"),

  sortOrder: z
    .enum(["asc", "desc"])
    .default("desc"),
}).refine(
  ({ fromDate, toDate }) => !fromDate || !toDate || fromDate <= toDate,
  {
    message: "fromDate must be before or equal to toDate",
    path: ["toDate"],
  },
);

export type OrderListQuery = z.infer<
  typeof orderListQuerySchema
>;

export type CreateOrderInput =
  z.infer<typeof createOrderSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});
