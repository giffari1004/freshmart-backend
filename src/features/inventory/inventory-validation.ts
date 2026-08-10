import z from "zod";
import {
  HISTORY_STOCK_SORT_BY,
  INVENTORY_SORT_BY,
  INVENTORY_SORT_ORDER,
} from "./inventory-constant";
import { StockJournalType } from "../../../generated/prisma";
export class InventoryValidation {
  static readonly GET_ALL_INVENTORY = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      search: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().trim().optional(),
      ),
      sortBy: z.enum(INVENTORY_SORT_BY).default("createdAt"),
      sortOrder: z.enum(INVENTORY_SORT_ORDER).default("desc"),
      storeId: z.string().uuid("Invalid store id").optional(),
    }),
  });
  static readonly CREATE_INVENTORY = z.object({
    body: z.object({
      storeId: z.string().uuid("Invalid store id"),
      productId: z.string().uuid("Invalid product id"),
      priceOverride: z.number().optional(),
    }),
  });
  static readonly DELETE_INVENTORY = z.object({
    params: z.object({
      id: z.string().uuid("Invalid inventory id"),
    }),
  });
  static readonly UPDATE_INVENTORY = z.object({
    params: z.object({
      id: z.string().uuid("Invalid inventory id"),
    }),
    body: z.object({
      priceOverride: z.number().optional(),
    }),
  });
  static readonly STOCK_IN = z.object({
    params: z.object({
      id: z.string().uuid("Invalid inventory id"),
    }),
    body: z.object({
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    }),
  });
  static readonly STOCK_OUT = z.object({
    params: z.object({
      id: z.string().uuid("Invalid inventory id"),
    }),
    body: z.object({
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    }),
  });
  static readonly GET_STOCK_HISTORY = z.object({
    params: z.object({
      id: z.string().uuid("Invalid inventory id"),
    }),
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().default(10),
      type: z.enum(StockJournalType).optional(),
      sortBy: z.enum(HISTORY_STOCK_SORT_BY).default("createdAt"),
      sortOrder: z.enum(INVENTORY_SORT_ORDER).default("desc"),
    }),
  });
}
export type getAllInventorySchema = z.infer<
  typeof InventoryValidation.GET_ALL_INVENTORY
>;
export type createInventorySchema = z.infer<
  typeof InventoryValidation.CREATE_INVENTORY
>;
export type updateInventorySchema = z.infer<
  typeof InventoryValidation.UPDATE_INVENTORY
>;
export type deleteInventorySchema = z.infer<
  typeof InventoryValidation.DELETE_INVENTORY
>;
export type stockInSchema = z.infer<typeof InventoryValidation.STOCK_IN>;
export type stockOutSchema = z.infer<typeof InventoryValidation.STOCK_OUT>;
export type getStockHistorySchema = z.infer<
  typeof InventoryValidation.GET_STOCK_HISTORY
>;
