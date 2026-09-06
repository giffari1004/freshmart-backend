import { Prisma } from "../../../generated/prisma";
import { Role } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { ConflictError } from "../../errors/ConflictError";
import { NotFoundError } from "../../errors/NotFoundError";

export async function findStoreAdminOrError(id: string) {
  const existing = await prisma.user.findUnique({
    where: { id },
  });
  if (!existing || existing.role !== "STORE_ADMIN" || existing.deletedAt) {
    throw new NotFoundError("Account is not found");
  }
  return existing;
}

export async function checkDuplicateEmail(email: string) {
  const duplicate = await prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });
  if (duplicate)
    throw new ConflictError(
      "Duplicate email account",
    );
}
export function whereUser(
  search?: string,
  role?: Role,
): Prisma.UserWhereInput {
  return {
    deletedAt: null,
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(role && { role }),
  };
}
