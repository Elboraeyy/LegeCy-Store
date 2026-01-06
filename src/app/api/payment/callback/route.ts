import { NextResponse } from 'next/server';

/**
 * Paymob sends POST to this endpoint after payment
 * We convert the POST body to URL params and redirect to the page
 */
export async function POST(request: Request) {
    console.log('=== Paymob POST Callback Received ===');
    
    try {
        const body = await request.json();
        console.log('POST body:', JSON.stringify(body, null, 2));
        
        // Extract transaction data from nested obj if present
        const transaction = body.obj || body;
        
        // Build URL params from transaction data
        const params = new URLSearchParams();
        
        // Map transaction fields to URL params
        if (transaction.id) params.set('id', String(transaction.id));
        if (transaction.pending !== undefined) params.set('pending', String(transaction.pending));
        if (transaction.amount_cents) params.set('amount_cents', String(transaction.amount_cents));
        if (transaction.success !== undefined) params.set('success', String(transaction.success));
        if (transaction.is_auth !== undefined) params.set('is_auth', String(transaction.is_auth));
        if (transaction.is_capture !== undefined) params.set('is_capture', String(transaction.is_capture));
        if (transaction.is_standalone_payment !== undefined) params.set('is_standalone_payment', String(transaction.is_standalone_payment));
        if (transaction.is_voided !== undefined) params.set('is_voided', String(transaction.is_voided));
        if (transaction.is_refunded !== undefined) params.set('is_refunded', String(transaction.is_refunded));
        if (transaction.is_3d_secure !== undefined) params.set('is_3d_secure', String(transaction.is_3d_secure));
        if (transaction.integration_id) params.set('integration_id', String(transaction.integration_id));
        if (transaction.profile_id) params.set('profile_id', String(transaction.profile_id));
        if (transaction.has_parent_transaction !== undefined) params.set('has_parent_transaction', String(transaction.has_parent_transaction));
        if (transaction.order?.id) params.set('order', String(transaction.order.id));
        if (transaction.created_at) params.set('created_at', transaction.created_at);
        if (transaction.currency) params.set('currency', transaction.currency);
        if (transaction.merchant_order_id) params.set('merchant_order_id', transaction.merchant_order_id);
        if (transaction.source_data?.type) params.set('source_data.type', transaction.source_data.type);
        if (transaction.source_data?.pan) params.set('source_data.pan', transaction.source_data.pan);
        if (transaction.source_data?.sub_type) params.set('source_data.sub_type', transaction.source_data.sub_type);
        if (transaction.data?.message) params.set('data.message', transaction.data.message);
        
        // Get HMAC from header if present
        const hmac = request.headers.get('hmac');
        if (hmac) params.set('hmac', hmac);
        
        console.log('Redirecting to callback page with params');
        
        // Redirect to the callback page with all params
        const origin = new URL(request.url).origin;
        const redirectUrl = `${origin}/payment/callback?${params.toString()}`;
        
        console.log('Redirect URL:', redirectUrl);
        
        return NextResponse.redirect(redirectUrl, { status: 303 });
        
    } catch (error) {
        console.error('Error processing Paymob POST:', error);
        
        // Try to handle as form data
        try {
            const formData = await request.formData();
            const params = new URLSearchParams();
            
            formData.forEach((value, key) => {
                params.set(key, String(value));
            });
            
            const origin = new URL(request.url).origin;
            return NextResponse.redirect(`${origin}/payment/callback?${params.toString()}`, { status: 303 });
        } catch {
            // Fallback: redirect to callback with error
            const origin = new URL(request.url).origin;
            return NextResponse.redirect(`${origin}/payment/callback?error=processing_failed`, { status: 303 });
        }
    }
}

// GET just redirects to the page (for manual testing)
export async function GET(request: Request) {
    const url = new URL(request.url);
    const params = url.searchParams.toString();
    
    // Just redirect to the page with same params
    return NextResponse.redirect(`${url.origin}/payment/callback${params ? '?' + params : ''}`, { status: 303 });
}
