-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT,
    "orderId" TEXT NOT NULL,
    "transactionId" TEXT,
    "transactionStatus" TEXT NOT NULL,
    "statusCode" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL,
    "signatureKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_webhook_events_orderId_idx" ON "payment_webhook_events"("orderId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_transactionId_idx" ON "payment_webhook_events"("transactionId");

-- AddForeignKey
ALTER TABLE "payment_webhook_events" ADD CONSTRAINT "payment_webhook_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
