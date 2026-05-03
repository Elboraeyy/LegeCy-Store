import { NextRequest, NextResponse } from 'next/server';
import { fetchCustomers } from '@/lib/actions/customer';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(req: NextRequest) {
    const admin = await validateMobileToken(req);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const result = await fetchCustomers({ search, page, pageSize: limit, skipAuthCheck: true });
        return NextResponse.json(result);
    } catch (error) {
        console.error('[API] Customer search failed:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}
