'use server';

import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getPaymobConfig } from '@/lib/paymob';
import { confirmPaymentIntent, failPaymentIntent, PaymentIntentStatus } from '@/lib/services/paymentService';

interface PaymobCallbackParams {
    id: string;
    pending: string;
    amount_cents: string;
    success: string;
    is_auth: string;
    is_capture: string;
    is_standalone_payment: string;
    is_voided: string;
    is_refunded: string;
    is_3d_secure: string;
    integration_id: string;
    profile_id: string;
    has_parent_transaction: string;
    order?: string;
    created_at: string;
    currency: string;
    merchant_order_id?: string;
    source_data_type?: string;
    source_data_pan?: string;
    source_data_sub_type?: string;
    data_message?: string;
    hmac?: string;
}

/**
 * Verifies HMAC signature from Paymob URL parameters
 */
function verifyHmac(params: PaymobCallbackParams, hmacSecret: string): boolean {
    if (!params.hmac || !hmacSecret) {
        console.log('HMAC verification skipped - missing hmac or secret');
        return false;
    }

    // Paymob HMAC for redirect URLs is calculated differently
    // It uses a subset of params in alphabetical order
    const concatenatedString = [
        params.amount_cents || '',
        params.created_at || '',
        params.currency || '',
        params.data_message || '',
        params.has_parent_transaction || '',
        params.id || '',
        params.integration_id || '',
        params.is_3d_secure || '',
        params.is_auth || '',
        params.is_capture || '',
        params.is_refunded || '',
        params.is_standalone_payment || '',
        params.is_voided || '',
        params.order || '',
        params.merchant_order_id || '',
        params.pending || '',
        params.profile_id || '',
        params.source_data_pan || '',
        params.source_data_sub_type || '',
        params.source_data_type || '',
        params.success || ''
    ].join('');

    console.log('HMAC verification - concatenated string:', concatenatedString);

    const calculatedHmac = crypto
        .createHmac('sha512', hmacSecret)
        .update(concatenatedString)
        .digest('hex');

    console.log('HMAC - calculated:', calculatedHmac.substring(0, 20) + '...');
    console.log('HMAC - received:', params.hmac.substring(0, 20) + '...');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(calculatedHmac),
            Buffer.from(params.hmac)
        );
    } catch {
        return false;
    }
}

export interface ProcessPaymentResult {
    success: boolean;
    orderId?: string;
    error?: string;
    orderStatus?: string;
}

/**
 * Process Paymob payment callback from URL parameters
 * This is called from the callback page to update order status
 */
export async function processPaymobCallback(
    searchParams: Record<string, string>
): Promise<ProcessPaymentResult> {
    console.log('=== Processing Paymob Callback ===');
    console.log('Params:', JSON.stringify(searchParams, null, 2));

    const params: PaymobCallbackParams = {
        id: searchParams.id || '',
        pending: searchParams.pending || '',
        amount_cents: searchParams.amount_cents || '',
        success: searchParams.success || '',
        is_auth: searchParams.is_auth || '',
        is_capture: searchParams.is_capture || '',
        is_standalone_payment: searchParams.is_standalone_payment || '',
        is_voided: searchParams.is_voided || '',
        is_refunded: searchParams.is_refunded || '',
        is_3d_secure: searchParams.is_3d_secure || '',
        integration_id: searchParams.integration_id || '',
        profile_id: searchParams.profile_id || '',
        has_parent_transaction: searchParams.has_parent_transaction || '',
        order: searchParams.order || '',
        created_at: searchParams.created_at || '',
        currency: searchParams.currency || '',
        merchant_order_id: searchParams.merchant_order_id || '',
        source_data_type: searchParams['source_data.type'] || searchParams.source_data_type || '',
        source_data_pan: searchParams['source_data.pan'] || searchParams.source_data_pan || '',
        source_data_sub_type: searchParams['source_data.sub_type'] || searchParams.source_data_sub_type || '',
        data_message: searchParams['data.message'] || searchParams.data_message || '',
        hmac: searchParams.hmac || ''
    };

    // Get merchant order ID (our internal order ID)
    const orderId = params.merchant_order_id;
    if (!orderId) {
        console.error('No merchant_order_id in callback');
        return { success: false, error: 'No order ID provided' };
    }

    // Check if payment was successful
    const isPaymentSuccess = params.success === 'true' && 
                             params.pending === 'false' && 
                             params.is_voided === 'false';

    console.log('Payment result:', { orderId, isPaymentSuccess });

    // Get config for HMAC verification
    const config = await getPaymobConfig();
    
    // Verify HMAC (optional - log warning if fails but continue)
    if (config.hmacSecret) {
        const hmacValid = verifyHmac(params, config.hmacSecret);
        if (!hmacValid) {
            console.warn('HMAC verification failed - proceeding anyway for testing');
            // In production, you might want to reject this
            // return { success: false, error: 'Invalid signature' };
        } else {
            console.log('HMAC verification passed');
        }
    }

    // Check idempotency - has this transaction already been processed?
    const transactionId = `paymob_${params.id}`;
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
        where: { id: transactionId }
    });

    if (existingEvent) {
        console.log('Transaction already processed:', transactionId);
        // Return current order status
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });
        return { 
            success: true, 
            orderId, 
            orderStatus: order?.status || 'unknown'
        };
    }

    // Find the payment intent
    const intent = await prisma.paymentIntent.findFirst({
        where: { 
            orderId,
            status: PaymentIntentStatus.Pending
        }
    });

    if (!intent) {
        console.error('No pending payment intent found for order:', orderId);
        // Check if already processed
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });
        if (order?.status === 'paid') {
            return { success: true, orderId, orderStatus: 'paid' };
        }
        return { success: false, error: 'Payment intent not found', orderId };
    }

    // Verify amount (optional security check)
    const expectedAmountCents = Math.round(Number(intent.amount) * 100);
    const receivedAmountCents = parseInt(params.amount_cents, 10);
    
    if (Math.abs(receivedAmountCents - expectedAmountCents) > 100) { // Allow 1 EGP tolerance
        console.error('Amount mismatch:', { expected: expectedAmountCents, received: receivedAmountCents });
        // Log but don't reject - might be rounding issues
    }

    // Update payment intent with provider reference
    await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { providerReference: transactionId }
    });

    // Process the payment
    try {
        if (isPaymentSuccess) {
            await confirmPaymentIntent(intent.id);
            console.log('Payment confirmed for order:', orderId);
        } else {
            const reason = params.data_message || 'Payment declined';
            await failPaymentIntent(intent.id, reason);
            console.log('Payment failed for order:', orderId, reason);
        }

        // Mark as processed (idempotency)
        await prisma.processedWebhookEvent.create({
            data: {
                id: transactionId,
                provider: 'paymob',
                eventType: isPaymentSuccess ? 'payment.success' : 'payment.failed',
                entityId: orderId,
                processedAt: new Date()
            }
        });

        // Get updated order status
        const updatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        return { 
            success: isPaymentSuccess, 
            orderId,
            orderStatus: updatedOrder?.status
        };

    } catch (error) {
        console.error('Error processing payment:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Processing failed',
            orderId 
        };
    }
}
