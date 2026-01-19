import { NextResponse } from 'next/server';
import { runDailyMaintenance } from '@/lib/services/backgroundJobs';

/**
 * Daily Maintenance Cron Endpoint
 * 
 * Run with: curl -H "x-cron-secret: YOUR_SECRET" https://yoursite.com/api/cron/daily
 * 
 * Should be triggered by a cron scheduler (Vercel Cron, Upstash QStash, etc.)
 */

export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await runDailyMaintenance();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error('Daily maintenance failed:', error);
    return NextResponse.json({ 
      error: 'Maintenance failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
