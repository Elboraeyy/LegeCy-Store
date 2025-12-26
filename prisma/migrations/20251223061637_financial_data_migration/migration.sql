/*
  Warnings:

  - You are about to alter the column `totalPrice` on the `Order` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `amount` on the `PaymentIntent` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.
  - You are about to alter the column `price` on the `Variant` table. The data in that column could be lost. The data in that column will be cast from `Float` to `Decimal`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalPrice" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Order_status_fkey" FOREIGN KEY ("status") REFERENCES "OrderStatusEnum" ("value") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "id", "status", "totalPrice", "userId") SELECT "createdAt", "id", "status", "totalPrice", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "name", "orderId", "price", "productId", "quantity", "variantId") SELECT "id", "name", "orderId", "price", "productId", "quantity", "variantId" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_PaymentIntent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'manual',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentIntent_status_fkey" FOREIGN KEY ("status") REFERENCES "PaymentIntentStatusEnum" ("value") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentIntent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentIntent" ("amount", "createdAt", "expiresAt", "id", "orderId", "provider", "status") SELECT "amount", "createdAt", "expiresAt", "id", "orderId", "provider", "status" FROM "PaymentIntent";
DROP TABLE "PaymentIntent";
ALTER TABLE "new_PaymentIntent" RENAME TO "PaymentIntent";
CREATE UNIQUE INDEX "PaymentIntent_orderId_key" ON "PaymentIntent"("orderId");
CREATE TABLE "new_Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Variant" ("createdAt", "id", "price", "productId", "sku", "updatedAt") SELECT "createdAt", "id", "price", "productId", "sku", "updatedAt" FROM "Variant";
DROP TABLE "Variant";
ALTER TABLE "new_Variant" RENAME TO "Variant";
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
