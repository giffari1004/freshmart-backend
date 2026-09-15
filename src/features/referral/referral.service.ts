import { Prisma } from "../../../generated/prisma";
import { prisma } from "../../configs/prisma-client-config";
import { NotFoundError } from "../../errors/NotFoundError";

const REFERRAL_VOUCHER_CODE = "REFERRAL10";

export class ReferralService {
  static async rewardReferralVoucher(
    userId: string,
    db: Prisma.TransactionClient = prisma,
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referredById: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.referredById) {
      return null;
    }

    const voucher = await db.voucher.findFirst({
      where: {
        code: REFERRAL_VOUCHER_CODE,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!voucher) {
      throw new NotFoundError("Referral voucher not found");
    }

    const existingUserVoucher = await db.userVoucher.findUnique({
      where: {
        userId_voucherId: {
          userId: user.id,
          voucherId: voucher.id,
        },
      },
    });

    if (existingUserVoucher) {
      return existingUserVoucher;
    }

    return db.userVoucher.create({
      data: {
        userId: user.id,
        voucherId: voucher.id,
        source: "REFERRAL",
      },
    });
  }
}
