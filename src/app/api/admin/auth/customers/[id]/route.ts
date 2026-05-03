import { NextRequest, NextResponse } from 'next/server';
import { fetchCustomerDetails } from '@/lib/actions/customer';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await validateMobileToken(req);
    if (!admin) return unauthorizedResponse();

    try {
        const { id } = await params;
        const customer = await fetchCustomerDetails(id, true);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json(customer);
    } catch (error) {
        console.error('[API] Fetch customer details failed:', error);
        return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
    }
}
