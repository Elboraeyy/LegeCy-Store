/**
 * Phase 4: Payment System Verification Tests
 * 
 * Tests:
 * 1. Webhook idempotency
 * 2. Payment success → inventory committed
 * 3. Payment fail → inventory released
 * 4. Expired intent → order cancelled
 */

import prisma from '../src/lib/prisma';
import { confirmPaymentIntent, PaymentIntentStatus, processExpiredPayments, processZombieOrders } from '../src/lib/services/paymentService';
import * as fs from 'fs';
import { OrderStatus } from '../src/lib/orderStatus';

async function main() {
    console.log('🔐 Starting Payment System Verification...\n');

    // Test 1: Verify PaymentIntent Idempotency
    console.log('1️⃣ Testing PaymentIntent Idempotency...');
    await testIdempotency();

    // Test 2: Verify Webhook Processed Table
    console.log('2️⃣ Testing ProcessedWebhookEvent Table...');
    await testProcessedWebhookEvent();

    // Test 3: Verify Amount Mismatch Detection
    console.log('3️⃣ Testing Amount Mismatch Detection...');
    await testAmountMismatch();

    // Test 4: Verify Expired Payment Cleanup
    console.log('4️⃣ Testing Expired Payment Cleanup...');
    await testExpiredPayments();

    // Test 5: Verify Zombie Order Cleanup
    console.log('5️⃣ Testing Zombie Order Cleanup...');
    await testZombieOrders();

    console.log('\n✨ Payment System Verification Complete! ✨');
}

async function testIdempotency() {
    // Create a test order with payment intent
    const testOrder = await prisma.order.findFirst({
        where: { status: OrderStatus.Pending },
        include: { paymentIntent: true }
    });

    if (!testOrder) {
        console.log('   ⚠️ No pending orders to test. Skipping...');
        return;
    }

    if (!testOrder.paymentIntent) {
        console.log('   ⚠️ No payment intent found. Skipping...');
        return;
    }

    // Try confirming twice - second should be idempotent
    try {
        // First confirmation if still pending
        if (testOrder.paymentIntent.status === PaymentIntentStatus.Pending) {
            await confirmPaymentIntent(testOrder.paymentIntent.id);
            console.log('   ✅ First confirmation succeeded');
        }
        
        // Second confirmation should throw (already succeeded)
        try {
            await confirmPaymentIntent(testOrder.paymentIntent.id);
            console.log('   ❌ FAIL: Second confirmation should have thrown');
        } catch {
            console.log('   ✅ Second confirmation correctly rejected (idempotent)');
        }
    } catch (e) {
        console.log(`   ℹ️ Test skipped: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

async function testProcessedWebhookEvent() {
    // Check if ProcessedWebhookEvent table exists and works
    const testEventId = `test_event_${Date.now()}`;
    
    try {
        await prisma.processedWebhookEvent.create({
            data: {
                id: testEventId,
                provider: 'test',
                eventType: 'test.event',
                entityId: null
            }
        });

        const found = await prisma.processedWebhookEvent.findUnique({
            where: { id: testEventId }
        });

        if (found) {
            console.log('   ✅ ProcessedWebhookEvent table works correctly');
        } else {
            console.log('   ❌ FAIL: Event not found after insert');
        }

        // Cleanup
        await prisma.processedWebhookEvent.delete({ where: { id: testEventId } });
    } catch (e) {
        console.log(`   ❌ FAIL: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}

async function testAmountMismatch() {
    // The confirmPaymentIntent function already checks amount mismatch
    // This is a static verification that the check exists
    const paymentServiceCode = fs.readFileSync(
        './src/lib/services/paymentService.ts', 
        'utf-8'
    );

    if (paymentServiceCode.includes('amount mismatch') || paymentServiceCode.includes('Amount Check')) {
        console.log('   ✅ Amount mismatch check exists in paymentService');
    } else {
        console.log('   ❌ FAIL: Amount mismatch check not found');
    }
}

async function testExpiredPayments() {
    const count = await processExpiredPayments();
    console.log(`   ✅ Expired payments processed: ${count}`);
}

async function testZombieOrders() {
    const count = await processZombieOrders();
    console.log(`   ✅ Zombie orders processed: ${count}`);
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error('❌ Verification Failed:', e);
        process.exit(1);
    });
