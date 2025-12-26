-- 1. Create Lookup Table
CREATE TABLE IF NOT EXISTS "OrderStatusEnum" (
    "value" TEXT PRIMARY KEY
);

-- 2. Seed Values (Single Source of Truth)
INSERT OR IGNORE INTO "OrderStatusEnum" ("value") VALUES
('pending'),
('paid'),
('shipped'),
('delivered'),
('cancelled');

-- 3. Drop Old Hardcoded Triggers
DROP TRIGGER IF EXISTS validate_order_status_insert;
DROP TRIGGER IF EXISTS validate_order_status_update;
DROP TRIGGER IF EXISTS validate_history_status_insert;

-- 4. Create New Dynamic Triggers

-- Trigger: Validate Order Insert
CREATE TRIGGER validate_order_status_insert
BEFORE INSERT ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW.status) THEN
            RAISE(ABORT, 'Invalid Order Status: Value not found in OrderStatusEnum')
    END;
END;

-- Trigger: Validate Order Update
CREATE TRIGGER validate_order_status_update
BEFORE UPDATE ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM "OrderStatusEnum" WHERE "value" = NEW.status) THEN
            RAISE(ABORT, 'Invalid Order Status: Value not found in OrderStatusEnum')
    END;
END;

-- Trigger: Validate History Insert (From/To)
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