import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { runAllReconciliation, getReconciliationHealth } from '@/lib/jobs/reconciliation';
import { getMetricsSnapshot } from '@/lib/monitoring';

/**
 * Cron Jobs API Endpoint
 * 
 * For Vercel Cron Jobs or external scheduler.
 * Secured via CRON_SECRET environment variable.
 * 
 * Usage:
 * - GET: Health check and metrics
 * - POST: Run reconciliation jobs
 */

// Vercel cron config (add to vercel.json):
// { "crons": [{ "path": "/api/cron/jobs", "schedule": "*/15 * * * *" }] }

async function verifyCronSecret(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development only
  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/jobs
 * Returns health check and metrics
 */
export async function GET() {
  if (!await verifyCronSecret()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [reconciliationHealth, metrics] = await Promise.all([
      getReconciliationHealth(),
      Promise.resolve(getMetricsSnapshot())
    ]);

    return NextResponse.json({
      status: reconciliationHealth.healthy ? 'healthy' : 'degraded',
      reconciliation: reconciliationHealth,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron health check failed:', error);
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/jobs
 * Runs all reconciliation jobs
 */
export async function POST() {
  if (!await verifyCronSecret()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[CRON] Starting reconciliation jobs...');
    
    const result = await runAllReconciliation();

    console.log('[CRON] Reconciliation complete', {
      success: result.overallSuccess,
      paymentIntents: result.paymentIntents.itemsProcessed,
      inventory: result.inventory.itemsProcessed,
      orderStatus: result.orderStatus.itemsProcessed
    });

    return NextResponse.json({
      success: result.overallSuccess,
      jobs: {
        paymentIntents: {
          success: result.paymentIntents.success,
          processed: result.paymentIntents.itemsProcessed,
          duration: result.paymentIntents.duration,
          issues: result.paymentIntents.issues
        },
        inventory: {
          success: result.inventory.success,
          processed: result.inventory.itemsProcessed,
          duration: result.inventory.duration,
          issues: result.inventory.issues
        },
        orderStatus: {
          success: result.orderStatus.success,
          processed: result.orderStatus.itemsProcessed,
          duration: result.orderStatus.duration,
          issues: result.orderStatus.issues
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Reconciliation failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
