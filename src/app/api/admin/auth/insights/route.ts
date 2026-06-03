import { NextRequest, NextResponse } from 'next/server';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { getFullMobileInsights } from '@/lib/services/mobileInsightsService';

/**
 * GET /api/admin/auth/insights
 * Unified source-of-truth metrics for analytics screens.
 * Query: ?month=6&year=2026 OR ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  const admin = await validateMobileToken(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const data = await getFullMobileInsights({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      month: searchParams.get('month'),
      year: searchParams.get('year'),
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Insights GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
