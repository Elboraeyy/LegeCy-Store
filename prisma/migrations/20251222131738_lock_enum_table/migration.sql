-- Trigger: Prevent Deleting Enum Values
CREATE TRIGGER prevent_order_status_enum_delete
BEFORE DELETE ON "OrderStatusEnum"
BEGIN
  SELECT RAISE(ABORT, 'OrderStatusEnum is immutable. Create a migration to modify it.');
END;

-- Trigger: Prevent Updating Enum Values
CREATE TRIGGER prevent_order_status_enum_update
BEFORE UPDATE ON "OrderStatusEnum"
BEGIN
  SELECT RAISE(ABORT, 'OrderStatusEnum is immutable. Create a migration to modify it.');
END;
