-- AlterTable
ALTER TABLE "OrderStatusHistory" ADD COLUMN "reason" TEXT;

-- CreateTable
CREATE TABLE "PaymentIntentStatusEnum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
