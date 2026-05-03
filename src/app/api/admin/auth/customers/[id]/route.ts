import { NextRequest, NextResponse } from 'next/server';
import { fetchCustomerDetails } from '@/lib/actions/customer';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customer = await fetchCustomerDetails(id);
        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }
        return NextResponse.json(customer);
    } catch (error) {
        console.error('[API] Fetch customer details failed:', error);
        return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
    }
}
