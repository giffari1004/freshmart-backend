import { z } from "zod";
import { PRODUCT_SORT_BY, PRODUCT_SORT_ORDER } from "./product-constant";

export class ProductValidation {
  static readonly CREATE_PRODUCT = z.object({
    body: z.object({
      name: z.string().trim().min(1, "Product name is required"),
      description: z.string().trim().optional(),
      basePrice: z.coerce
        .number()
        .positive("Base price must be greater than 0"),
      weight: z.coerce.number().int().positive("Weight must be greater than 0"),
      categoryId: z.string().uuid("Invalid category id"),
    }),
  });
  static readonly UPDATE_PRODUCT = z.object({
    params: z.object({
      id: z.string().uuid("Invalid product id"),
    }),
    body: z.object({
      name: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      basePrice: z.coerce
        .number()
        .positive("Base price must be greater than 0")
        .optional(),
      weight: z.coerce
        .number()
        .int()
        .positive("Weight must be greater than 0")
        .optional(),
      categoryId: z.string().uuid("Invalid category id").optional(),
    }),
  });
  static readonly GET_ALL_ADMIN_PRODUCT = z.object({
    query: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      search: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().trim().optional(),
      ),
      categoryId: z.string().uuid("Invalid category id").optional(),
      sortBy: z.enum(PRODUCT_SORT_BY).default("createdAt"),
      sortOrder: z.enum(PRODUCT_SORT_ORDER).default("desc"),
    }),
  });
  static readonly DELETE_PRODUCT = z.object({
    params: z.object({
      id: z.string().uuid("Invalid product id"),
    }),
  });
  static readonly GET_ALL_CUSTOMER_PRODUCT = z.object({
    query: z.object({
      storeId: z.string().uuid("Invalid store id"),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(10),
      search: z.preprocess(
        (val) => (val === "" ? undefined : val),
        z.string().trim().optional(),
      ),
      categoryId: z.string().uuid("Invalid category id").optional(),
      sortBy: z.enum(PRODUCT_SORT_BY).default("createdAt"),
      sortOrder: z.enum(PRODUCT_SORT_ORDER).default("desc"),
    }),
  });
  static readonly GET_PRODUCT_DETAIL = z.object({
    params: z.object({ id: z.string().uuid("Invalid product id") }),
    query: z.object({ storeId: z.string().uuid("Invalid store id") }),
  });
}
export type createProductSchema = z.infer<
  typeof ProductValidation.CREATE_PRODUCT
>;
export type deleteProductSchema = z.infer<
  typeof ProductValidation.DELETE_PRODUCT
>;
export type getAllAdminProductSchema = z.infer<
  typeof ProductValidation.GET_ALL_ADMIN_PRODUCT
>;
export type updateProductSchema = z.infer<
  typeof ProductValidation.UPDATE_PRODUCT
>;
export type getAllCustomerProductSchema = z.infer<typeof ProductValidation.GET_ALL_CUSTOMER_PRODUCT>;
export type getProductDetailSchema = z.infer<
  typeof ProductValidation.GET_PRODUCT_DETAIL
>;
