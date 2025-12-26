import { DomainError } from './domain-error';

export class InventoryError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVENTORY_ERROR', 400, details);
  }
}

export class InsufficientStockError extends InventoryError {
  constructor(sku: string, requested: number, available: number) {
    super(`Insufficient stock for ${sku}. Requested: ${requested}, Available: ${available}`, { sku, requested, available });
  }
}
