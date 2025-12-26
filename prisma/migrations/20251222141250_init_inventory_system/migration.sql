/*
  Warnings:

  - Made the column `value` on table `OrderStatusEnum` required. This step will fail if there are existing NULL values in that column.

*/

-- 1. Drop Dependencies (Triggers)
DROP TRIGGER IF EXISTS validate_order_status_insert;
DROP TRIGGER IF EXISTS validate_order_status_update;
DROP TRIGGER IF EXISTS validate_history_status_insert;

-- 2. Create New Tables
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Variant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warehouseId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Inventory_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 3. Modify Existing Tables (Redefine)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- OrderItem (Add variantId)
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "name", "orderId", "price", "productId", "quantity") SELECT "id", "name", "orderId", "price", "productId", "quantity" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";

-- OrderStatusEnum (Make value required primary key)
CREATE TABLE "new_OrderStatusEnum" (
    "value" TEXT NOT NULL PRIMARY KEY
);
INSERT INTO "new_OrderStatusEnum" ("value") SELECT "value" FROM "OrderStatusEnum";
DROP TABLE "OrderStatusEnum";
ALTER TABLE "new_OrderStatusEnum" RENAME TO "OrderStatusEnum";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- 4. Create Indexes
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");
CREATE UNIQUE INDEX "Warehouse_name_key" ON "Warehouse"("name");
CREATE UNIQUE INDEX "Inventory_warehouseId_variantId_key" ON "Inventory"("warehouseId", "variantId");

-- 5. Recreate Triggers (Crucial: Must be AFTER tables exist)

-- Inventory Triggers
CREATE TRIGGER validate_inventory_insert_available
BEFORE INSERT ON "Inventory"
BEGIN
    SELECT
    CASE
        WHEN NEW.available < 0 THEN
            RAISE(ABORT, 'Invalid Inventory State: Available stock cannot be negative')
    END;
END;

CREATE TRIGGER validate_inventory_update_available
BEFORE UPDATE ON "Inventory"
BEGIN
    SELECT
    CASE
        WHEN NEW.available < 0 THEN
            RAISE(ABORT, 'Invalid Inventory State: Available stock cannot be negative')
    END;
END;

CREATE TRIGGER validate_inventory_insert_reserved
BEFORE INSERT ON "Inventory"
BEGIN
    SELECT
    CASE
        WHEN NEW.reserved < 0 THEN
            RAISE(ABORT, 'Invalid Inventory State: Reserved stock cannot be negative')
    END;
END;

CREATE TRIGGER validate_inventory_update_reserved
BEFORE UPDATE ON "Inventory"
BEGIN
    SELECT
    CASE
        WHEN NEW.reserved < 0 THEN
            RAISE(ABORT, 'Invalid Inventory State: Reserved stock cannot be negative')
    END;
END;

-- OrderStatusEnum Triggers (Recreating dropped ones)
CREATE TRIGGER validate_order_status_insert
BEFORE INSERT ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW.status) THEN
            RAISE(ABORT, 'Invalid Order Status: Value not found in OrderStatusEnum')
    END;
END;

CREATE TRIGGER validate_order_status_update
BEFORE UPDATE ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW.status) THEN
            RAISE(ABORT, 'Invalid Order Status: Value not found in OrderStatusEnum')
    END;
END;

CREATE TRIGGER validate_history_status_insert
BEFORE INSERT ON "OrderStatusHistory"
BEGIN
    SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW."from") THEN
            RAISE(ABORT, 'Invalid From Status: Value not found in OrderStatusEnum')
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW."to") THEN
            RAISE(ABORT, 'Invalid To Status: Value not found in OrderStatusEnum')
    END;
END;
