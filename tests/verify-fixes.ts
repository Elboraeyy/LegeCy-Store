
import { PrismaClient } from '@prisma/client';
import { createOrder } from '../src/lib/services/orderService';
import { confirmPaymentIntent, processZombieOrders, PaymentIntentStatus } from '../src/lib/services/paymentService';
import { OrderStatus } from '../src/types/order';

const prisma = new PrismaClient();

async function main() {
    console.log('🐞 Starting Targeted Bug Fix Verification...');

    // 1. Setup Data
    const product = await prisma.product.findFirst({ include: { variants: true } });
    if (!product) throw new Error('No product found. Run seed.');
    const variant = product.variants[0];

    // ====================================================
    // TEST 1: Amount Validation in confirmPaymentIntent
    // ====================================================
    console.log('\n🧪 Test 1: Amount Validation Guard');
    
    const order1 = await createOrder({
        items: [{
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: 100,
            quantity: 1
        }],
        totalPrice: 100
    });

    console.log(`Creating PaymentIntent with WRONG amount for Order ${order1.id}...`);
    // Manually create an invalid intent since the service helper might enforce logic, 
    // or we use the service but modify the DB directly to simulate tampering.
    // Actually, createPaymentIntent takes amount.
    const intent1 = await prisma.paymentIntent.create({
        data: {
            orderId: order1.id,
            amount: 50.00, // HALF the price
            status: PaymentIntentStatus.Pending,
            expiresAt: new Date(Date.now() + 100000),
            provider: 'manual'
        }
    });

    try {
        await confirmPaymentIntent(intent1.id);
        throw new Error('❌ FAILED: confirmPaymentIntent should have thrown due to amount mismatch!');
    } catch (e) {
        if (e instanceof Error && e.message.includes('Payment amount mismatch')) {
            console.log('✅ PASS: Amount mismatch blocked.');
        } else {
            throw e;
        }
    }

    // ====================================================
    // TEST 2: Zombie Order Cleanup (Transaction)
    // ====================================================
    console.log('\n🧪 Test 2: Zombie Order Cleanup (Transaction Check)');

    const order2 = await createOrder({
        items: [{
            productId: product.id,
            variantId: variant.id,
            name: product.name,
            price: 100,
            quantity: 1
        }],
        totalPrice: 100
    });
    console.log(`Created potential zombie order: ${order2.id}`);

    // Backdate creation to 1 hour ago
    await prisma.order.update({
        where: { id: order2.id },
        data: { createdAt: new Date(Date.now() - 60 * 60 * 1000) }
    });

    console.log('🧟 Running Zombie Cleanup...');
    const nukedCount = await processZombieOrders();

    if (nukedCount < 1) {
        throw new Error('❌ FAILED: Zombie order was not cleaned up.');
    }

    const deadOrder = await prisma.order.findUnique({ where: { id: order2.id } });
    if (deadOrder?.status !== OrderStatus.Cancelled) {
        throw new Error('❌ FAILED: Zombie order status is not Cancelled.');
    }

    console.log(`✅ PASS: Zombie order ${order2.id} crushed successfully.`);
    console.log('🎉 Bug Fix Verification SUCCESS!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
