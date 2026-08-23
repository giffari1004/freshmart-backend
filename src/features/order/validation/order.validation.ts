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

  status: z.enum(ORDER_LIST_STATUS_VALUES).optional(),

  sortBy: z
    .enum(ORDER_LIST_SORT_FIELDS)
    .default("createdAt"),

  sortOrder: z
    .enum(ORDER_LIST_SORT_ORDERS)
    .default("desc"),
});

export type CreateOrderInput =
  z.infer<typeof createOrderSchema>;
