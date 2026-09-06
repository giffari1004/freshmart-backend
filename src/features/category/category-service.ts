import {
  getAllCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category-validation";
import { prisma } from "../../configs/prisma-client-config";
import { createMeta } from "../../helper/createMeta";
import {
  checkDuplicateCategory,
  findCategoryOrError,
  whereCategory,
} from "./category-helper";
import { getPagination } from "../../helper/getPagination";
export class CategoryService {
  static async getAll({ query }: getAllCategory) {
    const { page, limit, search, sortBy, sortOrder } = query;
    const {skip,take} = getPagination(page,limit)
    const where = whereCategory(search);
    const [categories, totalData] = await Promise.all([
      prisma.productCategory.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.productCategory.count({ where }),
    ]);
    const meta = createMeta(page, limit, totalData);
    return { categories, meta };
  }
  static async create({
    body,
    createdById,
  }: {
    body: createCategory["body"];
    createdById: string;
  }) {
    await checkDuplicateCategory(body.name);
    const createCategoryAcc = await prisma.productCategory.create({
      data: {
        name: body.name,
        createdById,
      },
    });
    return createCategoryAcc;
  }
  static async update({ params, body }: updateCategory) {
    await findCategoryOrError(params.id);
    if (body.name) {
      await checkDuplicateCategory(body.name, params.id);
    }
    const updateCategoryAcc = await prisma.productCategory.update({
      where: { id: params.id },
      data: { name: body.name },
    });
    return updateCategoryAcc;
  }
  static async delete({ params }: deleteCategory) {
    await findCategoryOrError(params.id);
    const deleteCategoryAcc = await prisma.productCategory.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return deleteCategoryAcc;
  }
}
