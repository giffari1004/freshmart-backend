/*
  Warnings:

  - A unique constraint covering the columns `[storeId,code]` on the table `vouchers` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "vouchers_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_storeId_code_key" ON "vouchers"("storeId", "code");
