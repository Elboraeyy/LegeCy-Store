export * from './domain-error';
export * from './order-errors';
export * from './inventory-errors';
export * from './common-errors';
export * from './payment-errors';

// Alias for backward compatibility code that might still import ForbiddenError
import { PermissionError } from './common-errors';
export const ForbiddenError = PermissionError;
