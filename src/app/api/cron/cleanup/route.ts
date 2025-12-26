import { processExpiredPayments, processZombieOrders } from '@/lib/services/paymentService';
import { NextResponse } from 'next/server';
import { PermissionError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { metrics, METRIC } from '@/lib/metrics';
import { config } from '@/lib/config';

// Force dynamic to ensure we always run fresh logic
export const dynamic = 'force-dynamic';

/**
 * CRON CLEANUP WORKER
 * 
 * Responsibilities:
 * 1. Process expired PaymentIntents → cancel orders, release stock
 * 2. Cleanup zombie orders → orders stuck without payment intent
 * 
 * Safety Features:
 * - Idempotent operations
 * - Graceful error handling
 * - Full logging
 * - Metrics tracking
 */

export async function GET(request: Request) {
    const requestId = request.headers.get('x-request-id') || 'cron-' + Date.now();
    const startTime = Date.now();
    
    logger.info('Cron cleanup started', { requestId, action: 'CRON_START' });
    
    try {
        // 1. Security Check
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Allow internal calls in development, otherwise enforce secret
        if (config.isProd && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
            logger.warn('Cron unauthorized access attempt', { requestId });
            throw new PermissionError('Unauthorized');
        }

        // 2. Run Cleanup Logic with metrics
        let expiredCount = 0;
        let zombieCount = 0;
        
        try {
            expiredCount = await processExpiredPayments();
            if (expiredCount > 0) {
                metrics.increment(METRIC.PAYMENTS_FAILED, expiredCount, { reason: 'expired' });
            }
        } catch (error) {
            logger.error('Failed to process expired payments', { 
                requestId, 
                error: error instanceof Error ? error.message : 'Unknown' 
            });
            metrics.increment(METRIC.WORKER_ERRORS, 1, { worker: 'expired_payments' });
        }
        
        try {
            zombieCount = await processZombieOrders();
            if (zombieCount > 0) {
                metrics.increment(METRIC.ORDERS_CANCELLED, zombieCount, { reason: 'zombie' });
            }
        } catch (error) {
            logger.error('Failed to process zombie orders', { 
                requestId, 
                error: error instanceof Error ? error.message : 'Unknown' 
            });
            metrics.increment(METRIC.WORKER_ERRORS, 1, { worker: 'zombie_orders' });
        }

        const duration = Date.now() - startTime;
        metrics.increment(METRIC.WORKER_RUNS, 1, { worker: 'cleanup' });
        metrics.recordLatency('cron_cleanup_duration_ms', duration);

        logger.info('Cron cleanup completed', { 
            requestId, 
            action: 'CRON_COMPLETE',
            expiredCount,
            zombieCount,
            durationMs: duration
        });

        // 3. Return Summary
        return NextResponse.json({
            success: true,
            requestId,
            results: {
                expiredPaymentsProcessed: expiredCount,
                zombieOrdersCancelled: zombieCount,
            },
            durationMs: duration,
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        metrics.increment(METRIC.WORKER_ERRORS, 1, { worker: 'cleanup' });
        
        logger.error('Cron cleanup failed', { 
            requestId, 
            error: error instanceof Error ? error.message : 'Unknown',
            durationMs: duration
        });
        
        if (error instanceof PermissionError) {
            return NextResponse.json(
                { error: { code: 'UNAUTHORIZED', message: 'Unauthorized', requestId } },
                { status: 401 }
            );
        }
        
        return NextResponse.json(
            { error: { code: 'WORKER_ERROR', message: 'Cleanup failed', requestId } },
            { status: 500 }
        );
    }
}
