import { prisma } from "../../../configs/prisma-client-config";
import { ConflictError } from "../../../errors/ConflictError";
import { NotFoundError } from "../../../errors/NotFoundError";

export async function findVoucherOrError(id: string) {
  const existingVoucher = await prisma.voucher.findUnique({
    where: { id },
  });
  if (!existingVoucher) throw new NotFoundError("Voucher not found");
  return existingVoucher;
}
export async function checkVoucherCodeDuplicate(code: string, excludeId?: string) {
  const existingVoucher = await prisma.voucher.findUnique({
    where: { code },
  });
  if (existingVoucher && existingVoucher.id !== excludeId) {
    throw new ConflictError("Voucher code already exists");
  }
}