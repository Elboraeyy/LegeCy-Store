import { DomainError } from './domain-error';

export class AuthError extends DomainError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', status: number = 401) {
    super(message, code, status);
  }
}

export class UnauthorizedError extends AuthError {
    constructor(message: string = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
    }
}

export class PermissionError extends AuthError {
    constructor(message: string = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
    }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ''}`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class PaymentError extends DomainError {
  constructor(message: string, details?: unknown) {
    super(message, 'PAYMENT_ERROR', 400, details);
  }
}
