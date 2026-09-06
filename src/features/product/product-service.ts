import { prisma } from "../../configs/prisma-client-config";
import { NotFoundError } from "../../errors/NotFoundError";
import { createMeta } from "../../helper/createMeta";
import { getPagination } from "../../helper/getPagination";
import { findCategoryOrError } from "../category/category-helper";
import { PRODUCT_INCLUDE } from "./product-constant";
import {
  checkDuplicateProduct,
  formatProductDetail,
  createImageCloudinary,
  findProductOrError,
  uploadProductImages,
  whereProduct,
  whereStoreProduct,
} from "./product-helper";
import {
  getAllAdminProductSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  getAllCustomerProductSchema,
  getProductDetailSchema,
} from "./product-validation";
export class ProductService {
  static async getAllAdminProduct({ query }: getAllAdminProductSchema) {
    const { page, limit, search, categoryId, sortBy, sortOrder } = query;
    const { skip, take } = getPagination(page, limit);
    const where = whereProduct(search, categoryId);
    const [products, totalData] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { images: true },
      }),
      prisma.product.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return {
      products,
      meta,
    };
  }
  static async create({
    body,
    createdById,
    files,
  }: {
    body: createProductSchema["body"];
    createdById: string;
    files: Express.Multer.File[];
  }) {
    await findCategoryOrError(body.categoryId);
    await checkDuplicateProduct(body.name);
    const imageUrls = await uploadProductImages(files);
    const createProductAcc = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        basePrice: body.basePrice,
        weight: body.weight,
        categoryId: body.categoryId,
        createdById,
        images: { create: createImageCloudinary(imageUrls) },
      },
      include: { images: true },
    });
    return createProductAcc;
  }
  static async update({ params, body }: updateProductSchema) {
    await findProductOrError(params.id);
    if (body.categoryId) await findCategoryOrError(body.categoryId);
    if (body.name) await checkDuplicateProduct(body.name, params.id);
    const updateProductAcc = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        basePrice: body.basePrice,
        weight: body.weight,
        categoryId: body.categoryId,
      },
      include: { images: true },
    });
    return updateProductAcc;
  }
  static async delete({ params }: deleteProductSchema) {
    await findProductOrError(params.id);
    const deleteProductAcc = await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return deleteProductAcc;
  }
  static async getAllCustomerProduct({ query }: getAllCustomerProductSchema) {
    const { storeId, page, limit, search, sortBy, sortOrder, categoryId } =
      query;
    const { skip, take } = getPagination(page, limit);
    const where = whereStoreProduct(storeId, search, categoryId);
    const [data, totalData] = await Promise.all([
      prisma.storeProduct.findMany({
        where,
        skip,
        take,
        orderBy: {
          product: {
            [sortBy]: sortOrder,
          },
        },
        include: PRODUCT_INCLUDE
      }),
      prisma.storeProduct.count({ where }),
    ]);
    const meta = createMeta(page,limit, totalData);
    return {
      data,
      meta,
    };
  }
  static async getProductDetail({ query, params }: getProductDetailSchema) {
    const item = await prisma.storeProduct.findFirst({
      where: {
        storeId: query.storeId,
        productId: params.id,
        deletedAt: null,
        product: {
          deletedAt: null,
        },
      },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { isPrimary: "desc" } },
          },
        },
      },
    });
    if (!item) throw new NotFoundError("Product not found");
    return formatProductDetail(item);
  }
}
