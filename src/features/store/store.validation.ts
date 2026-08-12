import { z } from "zod";
import {
  STORE_SORT_BY,
  STORE_SORT_ORDER,
  STORE_STATUS,
} from "./store.constant";

const storeCode = z
  .string()
  .trim()
  .min(1, "Store code is required")
  .max(50, "Store code is too long")
  .regex(
    /^[A-Za-z0-9-]+$/,
    "Store code can only contain letters, numbers, and dashes",
  )
  .transform((val) => val.toUpperCase());

export class StoreValidation {
  static readonly CREATE_STORE = z.object({
    body: z.object({
      name: z.string().trim().min(1, "Store name is required"),
      code: storeCode,
      address: z.string().trim().min(1, "Address is required"),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      maxServiceRadiusKm: z.coerce
        .number()
        .positive("Max service radius must be greater than 0"),
    }),
  });

  static readonly UPDATE_STORE = z.object({
    params: z.object({
      id: z.string().uuid("Invalid store id"),
    }),
    body: z.object({
      name: z.string().trim().min(1).optional(),
      code: storeCode.optional(),
      address: z.string().trim().min(1).optional(),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      maxServiceRadiusKm: z.coerce.number().positive().optional(),
      // sengaja z.boolean() polos, BUKAN z.coerce.boolean() — coerce boolean
      // di Zod itu cuma `Boolean(value)`, jadi string "false" akan ke-coerce
      // jadi `true` (truthy string). Untuk boolean, terima tipe asli saja.
      isActive: z.boolean().optional(),
    }),
  });

  static readonly GET_ALL_STORE = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      search: z
        .string()
        .trim()
        .optional()
        .transform((val) => (val === "" ? undefined : val)),
      status: z.enum(STORE_STATUS).optional(),
      sortBy: z.enum(STORE_SORT_BY).default("createdAt"),
      sortOrder: z.enum(STORE_SORT_ORDER).default("desc"),
    }),
  });

  static readonly GET_STORE_BY_ID = z.object({
    params: z.object({
      id: z.string().uuid("Invalid store id"),
    }),
  });

  static readonly DELETE_STORE = z.object({
    params: z.object({
      id: z.string().uuid("Invalid store id"),
    }),
  });

  static readonly ASSIGN_STORE_ADMIN = z.object({
    params: z.object({
      id: z.string().uuid("Invalid store id"),
    }),
    body: z.object({
      userId: z.string().uuid("Invalid user id"),
    }),
  });
}

export type createStoreSchema = z.infer<typeof StoreValidation.CREATE_STORE>;
export type updateStoreSchema = z.infer<typeof StoreValidation.UPDATE_STORE>;
export type getAllStoreSchema = z.infer<typeof StoreValidation.GET_ALL_STORE>;
export type getStoreByIdSchema = z.infer<
  typeof StoreValidation.GET_STORE_BY_ID
>;
export type deleteStoreSchema = z.infer<typeof StoreValidation.DELETE_STORE>;
export type assignStoreAdminSchema = z.infer<
  typeof StoreValidation.ASSIGN_STORE_ADMIN
>;
