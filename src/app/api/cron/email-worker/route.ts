import { processEmailQueue } from '@/lib/services/emailQueue';
import { NextResponse } from 'next/server';
import { PermissionError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

/**
 * Email Worker Cron Job
 * 
 * Processes the email queue and sends pending emails.
 * Should be called every 1-2 minutes.
 */
export async function GET(request: Request) {
    const requestId = request.headers.get('x-request-id') || 'email-worker-' + Date.now();
    const startTime = Date.now();
    
    logger.info('Email worker started', { requestId });
    
    try {
        // Security Check
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (config.isProd && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
            logger.warn('Email worker unauthorized access attempt', { requestId });
            throw new PermissionError('Unauthorized');
        }

        // Process email queue
        const result = await processEmailQueue();
        
        const duration = Date.now() - startTime;
        
        logger.info('Email worker completed', { 
            requestId, 
            sent: result.sent,
            failed: result.failed,
            durationMs: duration 
        });

        return NextResponse.json({
            success: true,
            requestId,
            results: {
                emailsSent: result.sent,
                emailsFailed: result.failed,
            },
            durationMs: duration,
        });

    } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('Email worker failed', { 
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
            { error: { code: 'WORKER_ERROR', message: 'Email worker failed', requestId } },
            { status: 500 }
        );
    }
}
