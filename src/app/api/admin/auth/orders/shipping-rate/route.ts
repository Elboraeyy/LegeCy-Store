import { NextRequest, NextResponse } from 'next/server';
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/auth/orders/shipping-rate
 * Calculate shipping rate for a given governorate and city.
 * Uses the same shipping logic as the website checkout.
 * 
 * Query params:
 *   - governorate (required): The shipping governorate
 *   - city (optional): The shipping city for more specific rate
 *   - subtotal (optional): Order subtotal for free shipping threshold check
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const governorate = searchParams.get('governorate');
        const city = searchParams.get('city') || undefined;
        const subtotal = parseFloat(searchParams.get('subtotal') || '0');

        if (!governorate) {
            return NextResponse.json(
                { error: 'Governorate is required' },
                { status: 400 }
            );
        }

        // Use the same shipping calculation as the website
        const { getShippingRateForGovernorate, getShippingSettings } = await import('@/lib/actions/shipping');
        
        const [rateResult, settings] = await Promise.all([
            getShippingRateForGovernorate(governorate, city),
            getShippingSettings(),
        ]);

        // Check free shipping threshold
        let finalRate = rateResult.rate;
        let isFreeShipping = rateResult.isFreeShipping;
        
        if (subtotal > 0 && subtotal >= settings.freeShippingThreshold) {
            finalRate = 0;
            isFreeShipping = true;
        }

        return NextResponse.json({
            rate: finalRate,
            zoneName: rateResult.zoneName,
            isFreeShipping,
            freeShippingThreshold: settings.freeShippingThreshold,
            defaultRate: settings.defaultShippingRate,
        });
    } catch (error) {
        console.error('Shipping Rate API Error:', error);
        return NextResponse.json(
            { error: 'Failed to calculate shipping rate' },
            { status: 500 }
        );
    }
}
