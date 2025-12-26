import { DomainError } from './domain-error';

/**
 * Error when webhook signature verification fails.
 * This indicates a potential security threat.
 */
export class WebhookSignatureError extends DomainError {
    constructor(message: string = 'Webhook signature verification failed', details?: Record<string, unknown>) {
        super(message, 'WEBHOOK_SIGNATURE_ERROR', 401, details);
        this.name = 'WebhookSignatureError';
    }
}

/**
 * Error when payment verification fails.
 * Amount mismatch, currency mismatch, or state issues.
 */
export class PaymentVerificationError extends DomainError {
    constructor(message: string = 'Payment verification failed', details?: Record<string, unknown>) {
        super(message, 'PAYMENT_VERIFICATION_ERROR', 400, details);
        this.name = 'PaymentVerificationError';
    }
}

/**
 * Error when an operation violates idempotency.
 * Indicates duplicate processing attempt.
 */
export class IdempotencyError extends DomainError {
    constructor(message: string = 'Duplicate operation detected', details?: Record<string, unknown>) {
        super(message, 'IDEMPOTENCY_ERROR', 409, details);
        this.name = 'IdempotencyError';
    }
}
