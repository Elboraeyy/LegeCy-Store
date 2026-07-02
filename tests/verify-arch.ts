
import { PrismaClient } from '@prisma/client';
import { createOrder, updateOrderStatus } from '../src/lib/services/orderService';
import { OrderStatus } from '../src/types/order'; // Import from types directly to avoid circular issues
import { createPaymentIntent, processExpiredPayments } from '../src/lib/services/paymentService';

const prisma = new PrismaClient();

async function main() {
    console.log('🏗️  Starting Architectural Verification...');

    // 1. Setup Data
    const product = await prisma.product.findFirst({ include: { variants: true } });
    if (!product) throw new Error('No product found. Run seed.');
    const variant = product.variants[0];

    // 2. Create Order
    console.log('🛒 Creating Order...');
    const order = await createOrder({
        items: [{
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: Number(variant.price),
            quantity: 1
        }],
        totalPrice: Number(variant.price)
    });
    console.log(`✅ Order Created: ${order.id}`);

    // 3. Test: Should FAIL to set Paid manually
    console.log('🧪 Testing Strict Payment Guard...');
    try {
        await updateOrderStatus(order.id, OrderStatus.Paid, 'admin', 'verify-test-admin');
        throw new Error('❌ FAILED: Manual update to Paid should have thrown an error!');
    } catch (e: unknown) {
        // We expect Access Denied (Forbidden) or "Use Payment Service" depending on where it failed.
        // Policy check comes first, so Forbidden Error is likely.
        const msg = e instanceof Error ? e.message : '';
        if (msg.includes("Access Denied") || msg.includes("Use Payment Service") || msg.includes("Invalid transition")) {
            console.log('✅ PASS: Manual update to Paid blocked.');
        } else {
            throw e;
        }
    }

    // 4. Create Payment Intent
    console.log('💳 Creating Payment Intent...');
    // We create a transaction to pass to service, or use service directly if it supports it.
    // The service expects tx for createPaymentIntent currently? Let's check signature.
    // It takes (tx, orderId, amount). 
    // We'll wrap in tx.
    await prisma.$transaction(async (tx) => {
        await createPaymentIntent(tx, order.id, order.totalPrice);
    }, {
        maxWait: 15000,
        timeout: 30000
    });
    console.log('✅ Payment Intent Created.');

    // 5. Test: Simulate Expiry & Cleanup
    console.log('⏳ Simulating Time Travel (Payment Expiry)...');
    await prisma.paymentIntent.update({
        where: { orderId: order.id },
        data: { expiresAt: new Date(Date.now() - 10000) } // Expired 10s ago
    });

    console.log('🧹 Running Payment Cleanup...');
    const count = await processExpiredPayments();
    
    if (count < 1) {
        throw new Error(`❌ FAILED: Expected at least 1 expired payment processed, got ${count}`);
    }
    console.log('✅ Payment Cleanup ran.');

    // 6. Verify Cancellation / Expiry
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    if (finalOrder?.status !== OrderStatus.PaymentFailed) {
        throw new Error(`❌ FAILED: Order status is ${finalOrder?.status}, expected payment_failed.`);
    }
    console.log('✅ PASS: Order marked as payment_failed by Payment Cleanup.');

    // 7. Verify Stock Return
    // (Optional but good)
    
    console.log('🎉 Architecture Verification SUCCESS!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
