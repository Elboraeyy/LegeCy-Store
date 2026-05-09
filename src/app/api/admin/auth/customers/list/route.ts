import { NextRequest, NextResponse } from 'next/server';
import { fetchCustomers } from '@/lib/actions/customer';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/customers/list
 * Fetch list of customers for the admin mobile app CRM
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || undefined;

        const data = await fetchCustomers({
            page,
            limit,
            search,
            skipAuthCheck: true, // We already validated the mobile token above
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error('Customers List API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers list' }, { status: 500 });
    }
}
