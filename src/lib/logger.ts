import pino from 'pino';
import { config } from './config';

/**
 * PRODUCTION-GRADE STRUCTURED LOGGER
 * 
 * Features:
 * - JSON formatted logs (searchable, ingestible)
 * - Correlation ID support
 * - Sensitive data redaction
 * - Service context
 * - Pretty printing in development
 */

// Pino options
const pinoOptions: pino.LoggerOptions = {
    level: config.logLevel,
    
    // Redact sensitive fields
    redact: {
        paths: [
            'password',
            'passwordHash',
            'secret',
            'token',
            'apiKey',
            'sessionId',
            'authorization',
            '*.password',
            '*.passwordHash',
            '*.secret',
            '*.token',
        ],
        censor: '[REDACTED]',
    },
    
    // Base context included in every log
    base: {
        service: 'Legacy-store',
        env: config.nodeEnv,
    },
    
    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,
    
    // Format errors properly
    formatters: {
        level: (label) => ({ level: label }),
        bindings: (bindings) => ({
            service: bindings.service,
            env: bindings.env,
        }),
    },
};

// Create base logger
const baseLogger = config.isDev
    ? pino({
        ...pinoOptions,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname,service,env',
            },
        },
    })
    : pino(pinoOptions);

// Logger context type
export interface LogContext {
    requestId?: string;
    correlationId?: string;
    actor?: string;
    orderId?: string;
    paymentIntentId?: string;
    action?: string;
    userId?: string;
    adminId?: string;
    [key: string]: unknown;
}

// Async local storage for request context
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

// Get current request ID from context
function getRequestId(): string | undefined {
    return requestContext.getStore()?.requestId;
}

// Create child logger with context
function withContext(context: LogContext) {
    const requestId = context.requestId || getRequestId();
    return baseLogger.child({ ...context, requestId });
}

// Main logger export
export const logger = {
    info: (message: string, context?: LogContext) => {
        const requestId = getRequestId();
        baseLogger.info({ ...context, requestId }, message);
    },
    
    warn: (message: string, context?: LogContext) => {
        const requestId = getRequestId();
        baseLogger.warn({ ...context, requestId }, message);
    },
    
    error: (message: string, context?: LogContext) => {
        const requestId = getRequestId();
        baseLogger.error({ ...context, requestId }, message);
    },
    
    debug: (message: string, context?: LogContext) => {
        const requestId = getRequestId();
        baseLogger.debug({ ...context, requestId }, message);
    },
    
    // Create a child logger for specific service/operation
    child: (context: LogContext) => withContext(context),
    
    // For fatal errors that should crash the process
    fatal: (message: string, context?: LogContext) => {
        const requestId = getRequestId();
        baseLogger.fatal({ ...context, requestId }, message);
    },
};

// Type export for backward compatibility
export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'fatal';

// Helper to create operation-specific logger
export function createOperationLogger(operation: string, orderId?: string) {
    return logger.child({ action: operation, orderId });
}
