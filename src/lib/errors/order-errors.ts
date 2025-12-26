import { DomainError } from './domain-error';

export class OrderError extends DomainError {
  constructor(message: string, code: string = 'ORDER_ERROR', details?: unknown) {
    super(message, code, 400, details);
  }
}

export class OrderNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Order not found: ${id}`, 'ORDER_NOT_FOUND', 404);
  }
}
