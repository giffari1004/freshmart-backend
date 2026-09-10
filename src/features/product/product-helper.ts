import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { BadRequestError } from "../../errors/BadRequestError";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { getProductInclude } from "./product-constant";

export function whereProduct(
  search?: string,
  categoryId?: string,
): Prisma.ProductWhereInput {
  return {
    deletedAt: null,
    ...(search && { name: { contains: search, mode: "insensitive" } }),
    ...(categoryId && { categoryId }),
  };
}
export async function checkDuplicateProduct(name: string, excludeId?: string) {
  const existingName = await prisma.product.findFirst({
    where: { name, ...(excludeId && { id: { not: excludeId } }) },
  });
  if (existingName) throw new ConflictError("Product name already exists");
}
export async function findProductOrError(id: string) {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError("Product not found");
  }
}
export async function uploadProductImages(files: Express.Multer.File[]) {
  try {
    return await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer, "products")),
    );
  } catch (error) {
    throw new BadRequestError("Failed to upload product images");
  }
}
export function whereStoreProduct(
  storeId: string,
  search?: string,
  categoryId?: string,
): Prisma.StoreProductWhereInput {
  return {
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
}
export function formatProductDetail(
  item: Prisma.StoreProductGetPayload<{
    include:  ReturnType<typeof getProductInclude> ;
  }>,
) {
  const stock = item.stockQuantity - item.reservedStock;
  return {
    id: item.product.id,
    storeProductId: item.id,
    name: item.product.name,
    discounts: item.product.discounts ,
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

export function createImageCloudinary(imageUrls: string[]) {
  return imageUrls.map((url, index) => ({
    imageUrl: url,
    isPrimary: index === 0,
  }));
}

export function activeDiscountInclude(now: Date) {
  return {
    where: {
      deletedAt: null,
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
      type: { in: ["DIRECT", "BUY1GET1"] as const },
    },
    select: {
      type: true,
      valueType: true,
      value: true,
    },
  };
}
