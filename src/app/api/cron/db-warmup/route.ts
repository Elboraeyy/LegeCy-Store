import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Database Warmup Endpoint
 * 
 * This endpoint keeps the Neon database "warm" by executing a simple query.
 * Call this every 4 minutes from cron-job.org to prevent cold starts.
 * 
 * URL: https://your-domain.com/api/cron/db-warmup
 * Method: GET
 * Schedule: Every 4 minutes (in cron-job.org)
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Execute a simple query to keep the connection warm
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    
    // Also warm up common queries
    await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count(),
    ]);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Database warmed up successfully',
      timestamp: result[0]?.now,
      duration: `${duration}ms`,
      counts: {
        warmed: true
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[DB Warmup] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to warm up database',
        duration: `${duration}ms`
      },
      { status: 500 }
    );
  }
}
