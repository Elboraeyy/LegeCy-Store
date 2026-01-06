'use server';

import prisma from '@/lib/prisma';
import { confirmPaymentIntent, PaymentIntentStatus } from '@/lib/services/paymentService';

export interface ProcessPaymentResult {
    success: boolean;
    orderId?: string;
    error?: string;
    orderStatus?: string;
    debug?: string;
}

/**
 * Process Paymob payment callback from URL parameters
 * Updates order status based on payment result
 */
export async function processPaymobCallback(
    searchParams: Record<string, string>
): Promise<ProcessPaymentResult> {
    console.log('=== Processing Paymob Callback ===');

    // Extract key params
    const transactionId = searchParams.id || searchParams.transaction_id || '';
    const orderId = searchParams.merchant_order_id || '';
    const success = searchParams.success === 'true';
    const pending = searchParams.pending === 'true';
    const isVoided = searchParams.is_voided === 'true';

    console.log('Params:', { transactionId, orderId, success, pending, isVoided });

    // Determine if payment was successful
    const isPaymentSuccess = success && !pending && !isVoided;
    console.log('Payment success:', isPaymentSuccess);

    if (!orderId) {
        console.error('No merchant_order_id');
        return { success: false, error: 'No order ID', debug: 'merchant_order_id missing' };
    }

    // Check idempotency - already processed?
    const processedEventId = `paymob_${transactionId}`;
    try {
        const existing = await prisma.processedWebhookEvent.findUnique({
            where: { id: processedEventId }
        });
        if (existing) {
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true }
            });
            console.log('Already processed, current status:', order?.status);
            return { 
                success: order?.status === 'paid',
                orderId, 
                orderStatus: order?.status || 'unknown',
                debug: 'Already processed'
            };
        }
    } catch (e) {
        console.log('Idempotency check failed:', e);
    }

    // Try to find and confirm PaymentIntent
    try {
        const intent = await prisma.paymentIntent.findFirst({
            where: { orderId, status: PaymentIntentStatus.Pending }
        });
        
        if (intent && isPaymentSuccess) {
            console.log('Found PaymentIntent, confirming:', intent.id);
            await confirmPaymentIntent(intent.id);
            
            // Mark processed
            await prisma.processedWebhookEvent.create({
                data: {
                    id: processedEventId,
                    provider: 'paymob',
                    eventType: 'payment.success',
                    entityId: orderId,
                    processedAt: new Date()
                }
            }).catch(() => {});
            
            const updated = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true }
            });
            
            return { 
                success: true, 
                orderId, 
                orderStatus: updated?.status || 'paid',
                debug: 'Confirmed via PaymentIntent'
            };
        }
        
        console.log('No pending PaymentIntent found, updating order directly');
    } catch (e) {
        console.error('PaymentIntent lookup failed:', e);
    }

    // FALLBACK: Update order status directly if payment was successful
    if (isPaymentSuccess) {
        try {
            // Update order to paid
            await prisma.order.update({
                where: { id: orderId },
                data: { status: 'paid' }
            });
            
            // Release stock reservation if any PaymentIntent exists
            const anyIntent = await prisma.paymentIntent.findFirst({
                where: { orderId }
            });
            if (anyIntent) {
                await prisma.paymentIntent.update({
                    where: { id: anyIntent.id },
                    data: { status: PaymentIntentStatus.Succeeded }
                });
            }
            
            // Log history
            await prisma.orderStatusHistory.create({
                data: {
                    orderId,
                    from: 'payment_pending',
                    to: 'paid',
                    reason: 'Payment Confirmed (Direct Update)'
                }
            }).catch(() => {});
            
            // Mark processed
            await prisma.processedWebhookEvent.create({
                data: {
                    id: processedEventId,
                    provider: 'paymob',
                    eventType: 'payment.success',
                    entityId: orderId,
                    processedAt: new Date()
                }
            }).catch(() => {});
            
            console.log('Order updated to paid directly');
            return { 
                success: true, 
                orderId, 
                orderStatus: 'paid',
                debug: 'Direct update to paid'
            };
            
        } catch (e) {
            console.error('Direct update failed:', e);
            return { 
                success: false, 
                error: 'Failed to update order',
                orderId,
                debug: `Error: ${e}`
            };
        }
    }

    // Payment failed
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true }
    });
    
    return { 
        success: false, 
        orderId, 
        orderStatus: order?.status || 'payment_failed',
        debug: 'Payment not successful'
    };
}
