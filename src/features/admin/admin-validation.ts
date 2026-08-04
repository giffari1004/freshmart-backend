import { z } from "zod";
import { Role } from "../../../generated/prisma";
import { USER_SORT_BY, USER_SORT_ORDER } from "./admin-constant";
export class AdminValidation {
  static readonly GET_ALL_USER = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      search: z.string().trim().optional().transform((val)=> val === "" ? undefined : val),
      role: z
        .enum([Role.CUSTOMER, Role.STORE_ADMIN, Role.SUPER_ADMIN])
        .optional(),
      sortBy: z.enum(USER_SORT_BY).default("createdAt"),
      sortOrder: z.enum(USER_SORT_ORDER).default("desc"),
    }),
  });
  static readonly CREATE_STORE_ADMIN = z.object({
    body: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email("Invalid email format"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      storeId: z.string().uuid(" Invalid input store id"),
    }),
  });
  static readonly UPDATE_STORE_ADMIN = z.object({
    params: z.object({
      id: z.string().uuid("Invalid user id"),
    }),
    body: z.object({
      name: z.string().min(1).optional(),
      storeId: z.string().uuid().optional(),
    }),
  });
  static readonly DELETE_STORE_ADMIN = z.object({
    params: z.object({
      id: z.string().uuid("Invalid user id"),
    }),
  });
}
export type getAllUserSchema = z.infer<typeof AdminValidation.GET_ALL_USER>;
export type createStoreAdminSchema = z.infer<
  typeof AdminValidation.CREATE_STORE_ADMIN
>;
export type updateStoreAdminSchema = z.infer<
  typeof AdminValidation.UPDATE_STORE_ADMIN
>;
export type deleteStoreAdminSchema = z.infer<typeof AdminValidation.DELETE_STORE_ADMIN>
