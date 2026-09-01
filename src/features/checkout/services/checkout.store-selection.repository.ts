import { prisma } from "../../../configs/prisma-client-config";

export class CheckoutStoreSelectionRepository {
  async findCandidates(productIds: string[]) {
    return prisma.storeProduct.findMany({
      where: {
        productId: { in: productIds },
        deletedAt: null,
        product: { isActive: true },
        store: { isActive: true, deletedAt: null },
      },
      include: {
        product: { include: { images: true } },
        store: true,
      },
    });
  }
}
