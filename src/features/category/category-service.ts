import {
  getAllCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category-validation";
import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";
export class CategoryService {
  static async getAll({ query }: getAllCategory) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;
    const take = limit;
    const where: Prisma.ProductCategoryWhereInput = {
      deletedAt: null,
      ...(search && {
        name: { contains: search, mode: "insensitive" },
      }),
    };
    const [categories, totalData] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        skip,
        take,
        orderBy: {[sortBy]: sortOrder},
      }),
      prisma.productCategory.count({where}),
    ]);
    return {
      categories,
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
  }: {
    body: createCategory["body"];
    createdById: string;
  }) {
    const existingName = await prisma.productCategory.findUnique({
      where: { name: body.name , },
    });
    if (existingName) throw new ConflictError("Category name already exists");
    const createCategoryAcc = await prisma.productCategory.create({
      data: {
        name: body.name,
        createdById,
      },
    });
    return createCategoryAcc;
  }
  static async update({ params, body }: updateCategory) {
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: params.id },
    });
    if (!existingCategory || existingCategory.deletedAt)
      throw new NotFoundError("Category not found");
    if (body.name) {
      const duplicate = await prisma.productCategory.findFirst({
        where: {name: body.name, id: {not: params.id}},
      });
      if (duplicate) throw new ConflictError("Category name already exists");
    }
    const updateCategoryAcc = await prisma.productCategory.update({
      where: { id: params.id },
      data: { name: body.name },
    });
    return updateCategoryAcc;
  }
  static async delete({ params }: deleteCategory) {
    const existingCategory = await prisma.productCategory.findUnique({
      where: { id: params.id },
    });
    if (!existingCategory || existingCategory.deletedAt)
      throw new NotFoundError("Category not found");
    const deleteCategoryAcc = await prisma.productCategory.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return deleteCategoryAcc;
  }
}