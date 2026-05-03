import { NextRequest, NextResponse } from 'next/server';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';
import { getShippingRateForGovernorate } from '@/lib/actions/shipping';

export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const governorate = searchParams.get('governorate');
        const city = searchParams.get('city');

        if (!governorate) {
            return NextResponse.json({ error: 'Governorate is required' }, { status: 400 });
        }

        const rateInfo = await getShippingRateForGovernorate(governorate, city || undefined);

        return NextResponse.json({
            rate: rateInfo.rate,
            zoneName: rateInfo.zoneName,
            isFreeShipping: rateInfo.isFreeShipping
        });
    } catch (error) {
        console.error('Mobile Shipping Rate Error:', error);
        return NextResponse.json({ error: 'Failed to fetch shipping rate' }, { status: 500 });
    }
}
