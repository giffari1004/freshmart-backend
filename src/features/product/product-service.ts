import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { uploadToCloudinary } from "../../utils/cloudinary";
import {
  getAllProductSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  getCatalogSchema,
  getProductDetailSchema,
} from "./product-validation";
export class ProductService {
  static async getAllAdminProduct({ query }: getAllProductSchema) {
    const { page, limit, search, categoryId, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
      ...(categoryId && { categoryId }),
    };
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
    return {
      products,
      meta: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
      },
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
    const category = await prisma.productCategory.findUnique({
      where: { id: body.categoryId },
    });
    if (!category || category.deletedAt) {
      throw new NotFoundError("Category not found");
    }
    const existingName = await prisma.product.findUnique({
      where: { name: body.name },
    });
    if (existingName) throw new ConflictError("Product name already exists");

    const imageUrls = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, "products")),
    );
    const createProductAcc = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description,
        basePrice: body.basePrice,
        weight: body.weight,
        categoryId: body.categoryId,
        createdById,
        images: {
          create: imageUrls.map((url, index) => ({
            imageUrl: url,
            isPrimary: index === 0,
          })),
        },
      },
      include: { images: true },
    });
    return createProductAcc;
  }
  static async update({ params, body }: updateProductSchema) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existingProduct || existingProduct.deletedAt) {
      throw new NotFoundError("Product not found");
    }
    if (body.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: body.categoryId },
      });
      if (!category || category.deletedAt) {
        throw new NotFoundError("Category not found");
      }
    }
    if (body.name) {
      const duplicate = await prisma.product.findFirst({
        where: { name: body.name, id: { not: params.id } },
      });
      if (duplicate) throw new ConflictError("Product name already exists");
    }
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
    const existingProduct = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!existingProduct || existingProduct.deletedAt) {
      throw new NotFoundError("Product not found");
    }
    const deleteProductAcc = await prisma.product.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return deleteProductAcc;
  }
  static async getAllCustomerProduct({ query }: getCatalogSchema) {
    const { storeId, page, limit, search, sortBy, sortOrder, categoryId } =
      query;
    const skip = (page - 1) * limit;
    const take = limit;
    const where: Prisma.StoreProductWhereInput = {
      storeId,
      deletedAt: null,
      product: {
        deletedAt: null,
        ...(search && {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }),
        ...(categoryId && { categoryId }),
      },
    };
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
        include: {
          product: {
            include: {
              category: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      }),
      prisma.storeProduct.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
      },
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
            images: {orderBy: {isPrimary: "desc"}},
          },
        },
      },
    });
    if (!item) throw new NotFoundError("Product not found");
    const stock = item.stockQuantity - item.reservedStock;
    return {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      category: item.product.category.name,
      price: item.priceOverride ?? item.product.basePrice,
      stock,
      isOutOfStock: stock <= 0,
      images: item.product.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
      })),
    };
  }
}
