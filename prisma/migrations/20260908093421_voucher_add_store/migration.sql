/*
  Warnings:

  - You are about to drop the column `discountId` on the `vouchers` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `vouchers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "vouchers" DROP CONSTRAINT "vouchers_discountId_fkey";

-- AlterTable
ALTER TABLE "vouchers" DROP COLUMN "discountId",
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
