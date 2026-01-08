import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { confirmPaymentIntent, failPaymentIntent, PaymentIntentStatus } from '@/lib/services/paymentService';
import { getPaymobConfig } from '@/lib/paymob';

/**
 * Paymob Webhook Handler (Transaction Processed Callback)
 * 
 * CRITICAL SECURITY RULES:
 * 1. ALWAYS verify HMAC signature
 * 2. ALWAYS check idempotency (ProcessedWebhookEvent)
 * 3. NEVER trust request body without verification
 * 4. Handle all events atomically
 * 
 * Paymob sends POST with JSON body containing transaction data
 */

interface PaymobTransaction {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    integration_id: number;
    profile_id: number;
    has_parent_transaction: boolean;
    order: {
        id: number;
        created_at: string;
        delivery_needed: boolean;
        merchant: {
            id: number;
            created_at: string;
        };
        amount_cents: number;
        shipping_data?: {
            id: number;
            first_name: string;
            last_name: string;
            email: string;
            phone_number: string;
        };
        items: Array<{
            name: string;
            description: string;
            amount_cents: number;
            quantity: number;
        }>;
    };
    created_at: string;
    currency: string;
    source_data: {
        pan: string;
        type: string;
        sub_type: string;
    };
    data: {
        message?: string;
        txn_response_code?: string;
    };
    merchant_order_id?: string; // Our orderId
}

interface PaymobCallback {
    type: string;
    obj: PaymobTransaction;
}

/**
 * Verify Paymob HMAC signature
 * 
 * CRITICAL SECURITY: This function is FAIL-CLOSED.
 * If HMAC secret is not configured, ALL webhooks are REJECTED.
 * This applies to ALL environments including development.
 */
function verifyPaymobHmac(obj: PaymobTransaction, hmacHeader: string, hmacSecret: string): { valid: boolean; error?: string } {
    // FAIL-CLOSED: If HMAC secret is not configured, REJECT ALL WEBHOOKS
    if (!hmacSecret) {
        logger.error('CRITICAL: PAYMOB_HMAC_SECRET is not configured - REJECTING WEBHOOK');
        return { valid: false, error: 'HMAC_SECRET_NOT_CONFIGURED' };
    }

    // FAIL-CLOSED: If no HMAC header received, REJECT
    if (!hmacHeader) {
        logger.error('CRITICAL: No HMAC header received in webhook - REJECTING');
        return { valid: false, error: 'HMAC_HEADER_MISSING' };
    }

    // Paymob HMAC is computed from concatenated values (in alphabetical order by key)
    // Reference: https://docs.paymob.com/docs/hmac-calculation
    const concatenatedString = [
        obj.amount_cents,
        obj.created_at,
        obj.currency,
        obj.data?.message || '',
        obj.has_parent_transaction,
        obj.id,
        obj.integration_id,
        obj.is_3d_secure,
        obj.is_auth,
        obj.is_capture,
        obj.is_refunded,
        obj.is_standalone_payment,
        obj.is_voided,
        obj.order.id,
        obj.order.merchant.id,
        obj.pending,
        obj.profile_id,
        obj.source_data.pan,
        obj.source_data.sub_type,
        obj.source_data.type,
        obj.success
    ].join('');

    const calculatedHmac = crypto
        .createHmac('sha512', hmacSecret)
        .update(concatenatedString)
        .digest('hex');

    try {
        const isValid = crypto.timingSafeEqual(
            Buffer.from(calculatedHmac),
            Buffer.from(hmacHeader)
        );
        return { valid: isValid, error: isValid ? undefined : 'HMAC_MISMATCH' };
    } catch {
        return { valid: false, error: 'HMAC_COMPARISON_FAILED' }; // Buffer length mismatch
    }
}


async function isEventProcessed(transactionId: number): Promise<boolean> {
    const existing = await prisma.processedWebhookEvent.findUnique({
        where: { id: `paymob_${transactionId}` }
    });
    return !!existing;
}

async function markEventProcessed(transactionId: number, success: boolean, entityId?: string): Promise<boolean> {
    // Use upsert to handle race conditions - if event already exists, don't insert
    try {
        await prisma.processedWebhookEvent.upsert({
            where: { id: `paymob_${transactionId}` },
            create: {
                id: `paymob_${transactionId}`,
                provider: 'paymob',
                eventType: success ? 'transaction.success' : 'transaction.failed',
                entityId
            },
            update: {} // Do nothing if exists
        });
        return true;
    } catch {
        // If upsert fails due to race condition, it's already processed
        return false;
    }
}

export async function POST(request: Request) {
    console.log('=== PAYMOB WEBHOOK RECEIVED ===');
    
    let body: PaymobCallback;
    
    try {
        body = await request.json();
        console.log('Webhook body received:', JSON.stringify(body, null, 2));
    } catch {
        console.error('Failed to parse webhook body');
        logger.warn('Invalid Paymob webhook payload');
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Fetch config (for HMAC secret)
    const config = await getPaymobConfig();
    // SECURITY: Never log secrets, even partially
    
    const hmacHeader = request.headers.get('hmac') || '';
    
    const transaction = body.obj;
    
    if (!transaction) {
        console.error('Missing transaction object');
        logger.warn('Missing transaction object in Paymob callback');
        return NextResponse.json({ error: 'Missing transaction' }, { status: 400 });
    }

    // 1. Verify HMAC Signature (FAIL-CLOSED)
    const hmacResult = verifyPaymobHmac(transaction, hmacHeader, config.hmacSecret);
    if (!hmacResult.valid) {
        logger.error('Paymob HMAC verification failed', { 
            transactionId: transaction.id,
            error: hmacResult.error
        });
        
        // Send critical alert for webhook security failures
        try {
            const { sendAlert } = await import('@/lib/monitoring');
            await sendAlert({
                type: 'SECURITY_ALERT',
                severity: 'critical',
                message: `Webhook HMAC verification failed: ${hmacResult.error}`,
                details: { transactionId: transaction.id, error: hmacResult.error }
            });
        } catch (e) {
            logger.error('Failed to send security alert', { error: e });
        }
        
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const transactionId = transaction.id;
    const orderId = transaction.merchant_order_id; // Our internal order ID
    const success = transaction.success && !transaction.pending && !transaction.is_voided;
    const amountCents = transaction.amount_cents;
    
    logger.info('Paymob webhook received', { 
        transactionId, 
        orderId, 
        success, 
        amountCents,
        currency: transaction.currency 
    });

    // 2. Idempotency Check
    if (await isEventProcessed(transactionId)) {
        logger.info('Paymob event already processed (idempotency)', { transactionId });
        return NextResponse.json({ received: true, duplicate: true });
    }

    // 3. Find PaymentIntent by orderId
    if (!orderId) {
        logger.warn('No merchant_order_id in Paymob callback', { transactionId });
        await markEventProcessed(transactionId, success);
        return NextResponse.json({ received: true, warning: 'No order ID' });
    }

    const intent = await prisma.paymentIntent.findFirst({
        where: { orderId, status: PaymentIntentStatus.Pending }
    });

    if (!intent) {
        logger.warn('PaymentIntent not found for Paymob callback', { 
            transactionId, 
            orderId 
        });
        await markEventProcessed(transactionId, success);
        return NextResponse.json({ received: true, warning: 'Intent not found' });
    }

    // Update provider reference
    await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { providerReference: `paymob_${transactionId}` }
    });

    // 4. Handle Transaction Result
    try {
        if (success) {
            // Verify amount matches (Paymob sends amount in cents)
            const expectedAmountCents = Math.round(Number(intent.amount) * 100);
            
            if (Math.abs(amountCents - expectedAmountCents) > 1) { // Allow 1 cent tolerance
                logger.error('Paymob amount mismatch - REJECTING PAYMENT', {
                    transactionId,
                    orderId,
                    received: amountCents,
                    expected: expectedAmountCents
                });
                // SECURITY: Reject mismatched amounts - do not process
                return NextResponse.json(
                    { error: 'Payment amount mismatch. Transaction rejected.' },
                    { status: 400 }
                );
            }

            await confirmPaymentIntent(intent.id);
            
            // Finance: Record Revenue in Ledger (Fire and forget)
            // Use intent.amount which is the base currency value
            import('@/lib/actions/finance').then(({ recordOrderRevenue }) => {
                recordOrderRevenue(orderId!, Number(intent.amount)).catch(e => console.error('Failed to record revenue (Webhook):', e));
            });

            logger.info('Payment confirmed via Paymob', { 
                intentId: intent.id, 
                orderId,
                transactionId 
            });
        } else {
            // Payment failed, voided, or declined
            const reason = transaction.data?.message || 
                          transaction.data?.txn_response_code || 
                          'Transaction declined';
            
            await failPaymentIntent(intent.id, `Paymob: ${reason}`);
            logger.info('Payment failed via Paymob', { 
                intentId: intent.id, 
                reason,
                transactionId 
            });
        }

        // 5. Mark as processed
        await markEventProcessed(transactionId, success, orderId);

        return NextResponse.json({ received: true, success: true });

    } catch (error) {
        logger.error('Paymob webhook processing error', { transactionId, error });
        // Don't mark as processed so Paymob can retry
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
    }
}

// GET returns 404 to hide endpoint existence
export async function GET() {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
