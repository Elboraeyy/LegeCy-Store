
import { PrismaClient } from '@prisma/client';
import { createOrder } from '../src/lib/services/orderService';
import { confirmPaymentIntent, processZombieOrders, PaymentIntentStatus } from '../src/lib/services/paymentService';
import { inventoryService } from '../src/lib/services/inventoryService';
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

    const warehouseId = await prisma.warehouse.findFirst().then(w => w?.id);
    if (!warehouseId) throw new Error("No warehouse found");

    const order2 = await prisma.$transaction(async (tx) => {
        // Reserve Stock
        await inventoryService.reserveStock(tx, warehouseId, variant.id, 1);

        return await tx.order.create({
            data: {
                totalPrice: 100,
                status: OrderStatus.Pending,
                paymentMethod: 'paymob',
                items: {
                    create: [{
                        productId: product.id,
                        variantId: variant.id,
                        name: product.name,
                        price: 100,
                        quantity: 1
                    }]
                }
            },
            include: { items: true }
        });
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

    // ====================================================
    // TEST 3: COD Order Protection (Zombie Cleanup)
    // ====================================================
    console.log('\n🧪 Test 3: COD Order Protection');

    // Create a COD order that is old enough to be a zombie
    // Use prisma directly to bypass logic that might enforce other things
    const codOrder = await prisma.order.create({
        data: {
            totalPrice: 100,
            status: OrderStatus.Pending,
            customerName: 'COD Survivor',
            customerEmail: 'cod@survivor.com',
            customerPhone: '1234567890',
            shippingAddress: '123 Street',
            shippingCity: 'Cairo',
            paymentMethod: 'cod',
            pointsEarned: 0,
            createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour old
            items: {
                create: {
                   productId: product.id,
                   variantId: variant.id,
                   name: product.name,
                   price: 100,
                   quantity: 1
                }
            }
        }
    });

    console.log(`Created COD Zombie Candidate: ${codOrder.id}`);
    
    // Run cleanup again
    const nukedCount2 = await processZombieOrders();
    console.log(`Cleanup ran. Deleted: ${nukedCount2}`);

    // Verify it still exists
    const survivor = await prisma.order.findUnique({ where: { id: codOrder.id } });
    
    // Status should NOT be Cancelled (should be Pending or whatever it was)
    if (survivor?.status === OrderStatus.Cancelled) {
        throw new Error('❌ FAILED: COD Order was wrongly cancelled by zombie cleanup!');
    }

    console.log(`✅ PASS: COD Order ${codOrder.id} survived zombie apocalypse.`);

    console.log('\n🎉 Bug Fix Verification SUCCESS!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
