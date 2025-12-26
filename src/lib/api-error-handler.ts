import { NextResponse } from 'next/server';
import { DomainError } from '@/lib/errors';
import { logger } from './logger';
import { ZodError } from 'zod';

/**
 * GLOBAL API ERROR HANDLER
 * 
 * Rules:
 * 1. Domain errors → mapped HTTP responses
 * 2. Unknown errors → generic 500 with logged context
 * 3. NEVER leak stack traces to clients
 * 4. ALWAYS include requestId for tracing
 */

// Error code to HTTP status mapping
const ERROR_STATUS_MAP: Record<string, number> = {
    'AUTHENTICATION_ERROR': 401,
    'PERMISSION_ERROR': 403,
    'VALIDATION_ERROR': 400,
    'INVENTORY_ERROR': 409,
    'INSUFFICIENT_STOCK': 409,
    'PAYMENT_ERROR': 402,
    'ORDER_POLICY_ERROR': 409,
    'ORDER_NOT_FOUND': 404,
    'NOT_FOUND': 404,
};

interface ErrorResponse {
    error: {
        code: string;
        message: string;
        requestId?: string;
        details?: unknown;
    };
}

export function handleApiError(error: unknown, requestId?: string): NextResponse<ErrorResponse> {
    const headers = requestId ? { 'x-request-id': requestId } : undefined;

    // 1. Domain Errors (Expected, graceful)
    if (error instanceof DomainError) {
        const status = ERROR_STATUS_MAP[error.code] || error.httpStatus || 400;
        
        logger.warn(`Domain error: ${error.code}`, { 
            action: 'API_ERROR',
            code: error.code,
            requestId,
            details: error.details,
        });

        return NextResponse.json(
            {
                error: {
                    code: error.code,
                    message: error.message,
                    requestId,
                    details: error.details,
                }
            },
            { status, headers }
        );
    }

    // 2. Zod Validation Errors
    if (error instanceof ZodError) {
        logger.warn('Validation error', { 
            action: 'API_VALIDATION_ERROR',
            requestId,
            issues: error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
        });
        
        return NextResponse.json(
            {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    requestId,
                    details: error.issues.map(i => ({
                        field: i.path.join('.'),
                        message: i.message,
                    })),
                }
            },
            { status: 400, headers }
        );
    }

    // 3. Unknown / Unexpected Errors (Log fully, respond generically)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Unhandled API error', { 
        action: 'API_UNHANDLED_ERROR',
        requestId,
        errorMessage,
        stack: errorStack,
    });

    // NEVER expose stack trace or internal details to client
    return NextResponse.json(
        {
            error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred. Please try again.',
                requestId,
            }
        },
        { status: 500, headers }
    );
}

// Helper to extract requestId from headers
export function getRequestId(request: Request): string {
    return request.headers.get('x-request-id') || 'unknown';
}
