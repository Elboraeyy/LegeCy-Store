'use server';

import prisma from '@/lib/prisma';
import { confirmPaymentIntent, failPaymentIntent, PaymentIntentStatus } from '@/lib/services/paymentService';

export interface ProcessPaymentResult {
    success: boolean;
    orderId?: string;
    error?: string;
    orderStatus?: string;
    debug?: string;
}

/**
 * Process Paymob payment callback from URL parameters
 * This is called from the callback page to update order status
 */
export async function processPaymobCallback(
    searchParams: Record<string, string>
): Promise<ProcessPaymentResult> {
    console.log('=== Processing Paymob Callback ===');
    console.log('Raw params:', JSON.stringify(searchParams, null, 2));

    // Extract key params
    const transactionId = searchParams.id || searchParams.transaction_id || '';
    const orderId = searchParams.merchant_order_id || '';
    const success = searchParams.success === 'true';
    const pending = searchParams.pending === 'true';
    const isVoided = searchParams.is_voided === 'true';
    const amountCents = parseInt(searchParams.amount_cents || '0', 10);

    console.log('Parsed params:', { transactionId, orderId, success, pending, isVoided, amountCents });

    // Determine if payment was successful
    const isPaymentSuccess = success && !pending && !isVoided;
    console.log('Payment success:', isPaymentSuccess);

    if (!orderId) {
        console.error('No merchant_order_id in callback');
        return { 
            success: false, 
            error: 'No order ID provided',
            debug: 'merchant_order_id missing from URL params'
        };
    }

    // Check if already processed (idempotency)
    const processedEventId = `paymob_${transactionId}`;
    
    try {
        const existingEvent = await prisma.processedWebhookEvent.findUnique({
            where: { id: processedEventId }
        });

        if (existingEvent) {
            console.log('Transaction already processed:', processedEventId);
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true }
            });
            return { 
                success: order?.status === 'paid',
                orderId, 
                orderStatus: order?.status || 'unknown',
                debug: 'Already processed'
            };
        }
    } catch (e) {
        console.log('Idempotency check failed, continuing:', e);
    }

    // Find the payment intent for this order
    let intent = null;
    try {
        intent = await prisma.paymentIntent.findFirst({
            where: { 
                orderId,
                status: PaymentIntentStatus.Pending
            }
        });
        console.log('Found payment intent:', intent?.id || 'None');
    } catch (e) {
        console.error('Error finding payment intent:', e);
    }

    if (!intent) {
        // Check if order exists and was already processed
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        if (existingOrder) {
            console.log('Order exists with status:', existingOrder.status);
            return { 
                success: existingOrder.status === 'paid',
                orderId, 
                orderStatus: existingOrder.status,
                debug: 'Payment intent not found, order exists'
            };
        }

        return { 
            success: false, 
            error: 'Order not found',
            orderId,
            debug: 'No payment intent and no order found'
        };
    }

    // Process the payment
    try {
        if (isPaymentSuccess) {
            console.log('Confirming payment for intent:', intent.id);
            await confirmPaymentIntent(intent.id);
            console.log('Payment confirmed successfully');
        } else {
            const reason = searchParams['data.message'] || searchParams.data_message || 'Payment declined';
            console.log('Failing payment for intent:', intent.id, 'Reason:', reason);
            await failPaymentIntent(intent.id, reason);
            console.log('Payment marked as failed');
        }

        // Mark as processed (idempotency)
        try {
            await prisma.processedWebhookEvent.create({
                data: {
                    id: processedEventId,
                    provider: 'paymob',
                    eventType: isPaymentSuccess ? 'payment.success' : 'payment.failed',
                    entityId: orderId,
                    processedAt: new Date()
                }
            });
        } catch (e) {
            console.log('Failed to mark as processed (might already exist):', e);
        }

        // Get updated order status
        const updatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true }
        });

        console.log('Final order status:', updatedOrder?.status);

        return { 
            success: isPaymentSuccess, 
            orderId,
            orderStatus: updatedOrder?.status || (isPaymentSuccess ? 'paid' : 'payment_failed'),
            debug: `Processed: ${isPaymentSuccess ? 'SUCCESS' : 'FAILED'}`
        };

    } catch (error) {
        console.error('Error processing payment:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Processing failed',
            orderId,
            debug: `Error: ${error}`
        };
    }
}
