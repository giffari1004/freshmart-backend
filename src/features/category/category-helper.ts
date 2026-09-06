import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";

export async function findCategoryOrError(id: string) {
  const existing = await prisma.productCategory.findUnique({
    where: { id },
  });
  if (!existing || existing.deletedAt)
    throw new NotFoundError("Category not found");
}
export function whereCategory(
  search?: string,
): Prisma.ProductCategoryWhereInput {
  return {
    deletedAt: null,
    ...(search && {
      name: { contains: search, mode: "insensitive" },
    }),
  };
}
export async function checkDuplicateCategory(name: string, excludeId?: string) {
  const duplicate = await prisma.productCategory.findFirst({
    where: { name , ...(excludeId && { id : {not:excludeId}})},
  });
  if (duplicate) throw new ConflictError("Category name already exists");
}
