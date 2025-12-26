-- Create Trigger to validate Order status on INSERT
CREATE TRIGGER IF NOT EXISTS validate_order_status_insert
BEFORE INSERT ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NEW.status NOT IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled') THEN
            RAISE(ABORT, 'Invalid Order Status')
    END;
END;

-- Create Trigger to validate Order status on UPDATE
CREATE TRIGGER IF NOT EXISTS validate_order_status_update
BEFORE UPDATE ON "Order"
BEGIN
    SELECT
    CASE
        WHEN NEW.status NOT IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled') THEN
            RAISE(ABORT, 'Invalid Order Status')
    END;
END;

-- Create Trigger to validate OrderStatusHistory from/to on INSERT
CREATE TRIGGER IF NOT EXISTS validate_history_status_insert
BEFORE INSERT ON "OrderStatusHistory"
BEGIN
    SELECT
    CASE
        WHEN NEW."from" NOT IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled') THEN
            RAISE(ABORT, 'Invalid From Status')
        WHEN NEW."to" NOT IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled') THEN
            RAISE(ABORT, 'Invalid To Status')
    END;
END;