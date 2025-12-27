/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Warehouse" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Egypt',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'MAIN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "fromWarehouseId" TEXT NOT NULL,
    "toWarehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "requestedQty" INTEGER NOT NULL,
    "sentQty" INTEGER,
    "receivedQty" INTEGER,
    "notes" TEXT,

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCount" (
    "id" TEXT NOT NULL,
    "countNumber" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "completedById" TEXT,
    "countDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryCount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryCountItem" (
    "id" TEXT NOT NULL,
    "countId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "systemQty" INTEGER NOT NULL,
    "countedQty" INTEGER,
    "variance" INTEGER,
    "notes" TEXT,
    "countedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryCountItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");

-- CreateIndex
CREATE INDEX "StockTransfer_fromWarehouseId_idx" ON "StockTransfer"("fromWarehouseId");

-- CreateIndex
CREATE INDEX "StockTransfer_toWarehouseId_idx" ON "StockTransfer"("toWarehouseId");

-- CreateIndex
CREATE INDEX "StockTransfer_createdAt_idx" ON "StockTransfer"("createdAt");

-- CreateIndex
CREATE INDEX "StockTransferItem_transferId_idx" ON "StockTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "StockTransferItem_variantId_idx" ON "StockTransferItem"("variantId");

-- CreateIndex
CREATE INDEX "StockAlert_status_idx" ON "StockAlert"("status");

-- CreateIndex
CREATE INDEX "StockAlert_alertType_idx" ON "StockAlert"("alertType");

-- CreateIndex
CREATE INDEX "StockAlert_warehouseId_idx" ON "StockAlert"("warehouseId");

-- CreateIndex
CREATE INDEX "StockAlert_variantId_idx" ON "StockAlert"("variantId");

-- CreateIndex
CREATE INDEX "StockAlert_createdAt_idx" ON "StockAlert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryCount_countNumber_key" ON "InventoryCount"("countNumber");

-- CreateIndex
CREATE INDEX "InventoryCount_status_idx" ON "InventoryCount"("status");

-- CreateIndex
CREATE INDEX "InventoryCount_warehouseId_idx" ON "InventoryCount"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryCount_countDate_idx" ON "InventoryCount"("countDate");

-- CreateIndex
CREATE INDEX "InventoryCountItem_countId_idx" ON "InventoryCountItem"("countId");

-- CreateIndex
CREATE INDEX "InventoryCountItem_variantId_idx" ON "InventoryCountItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransfer" ADD CONSTRAINT "StockTransfer_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCount" ADD CONSTRAINT "InventoryCount_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_countId_fkey" FOREIGN KEY ("countId") REFERENCES "InventoryCount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryCountItem" ADD CONSTRAINT "InventoryCountItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
