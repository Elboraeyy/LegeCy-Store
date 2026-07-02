
import { PrismaClient } from '@prisma/client';
// Use dynamic import or require for service to avoid build issues if strictly TS
import { createOrder } from '../src/lib/services/orderService';
import { createPaymentIntent, processExpiredPayments } from '../src/lib/services/paymentService'; // Updated import

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting End-to-End Verification: Inventory & TTL');

    // 1. Setup Data dynamically
    const product = await prisma.product.findFirst({ include: { variants: true } });
    if (!product) throw new Error('No product found. Run seed.');
    const variant = product.variants[0];

    const warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) throw new Error("No warehouse found");
    const warehouseId = warehouse.id;

    // Ensure variant has available stock
    const inventory = await prisma.inventory.upsert({
        where: { warehouseId_variantId: { warehouseId, variantId: variant.id } },
        create: { warehouseId, variantId: variant.id, available: 100, reserved: 0 },
        update: { available: 100 }
    });

    const initialAvailable = inventory.available;
    const initialReserved = inventory.reserved;

    console.log(`📊 Initial State: Available=${initialAvailable}, Reserved=${initialReserved}`);

    // 2. Create an Order (Reserve 5 items)
    const ORDER_QTY = 5;
    console.log(`\n🛍️  Creating Order for ${ORDER_QTY} items...`);
    
    // We expect this to default to "Pending" and reserve stock
    const order = await createOrder({
        items: [{
            variantId: variant.id,
            productId: variant.productId,
            name: 'Test Product',
            price: 100,
            quantity: ORDER_QTY
        }],
        totalPrice: 500
    });

    console.log(`✅ Order Created: ${order.id}`);

    // 3. Verify Inventory (Should be Reserved)
    const inventoryAfterOrder = await prisma.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId, variantId: variant.id } }
    });

    console.log(`📊 State After Order: Available=${inventoryAfterOrder?.available}, Reserved=${inventoryAfterOrder?.reserved}`);

    if (!inventoryAfterOrder) {
        throw new Error('❌ Verification Failed: Inventory record not found after order.');
    }

    if (inventoryAfterOrder.reserved !== initialReserved + ORDER_QTY) {
        throw new Error('❌ Verification Failed: Stock was not reserved correctly.');
    }
    if (inventoryAfterOrder.available !== initialAvailable - ORDER_QTY) {
        throw new Error('❌ Verification Failed: Available stock was not decremented.');
    }
    console.log('✨ Reservation Verified.');

    // 3.5 Create Payment Intent (New flow)
    console.log('\n💳 Creating Payment Intent...');
    await prisma.$transaction(async (tx) => {
        await createPaymentIntent(tx, order.id, 500);
    }, {
        timeout: 30000
    });
    console.log('✅ Payment Intent Created.');

    // 4. Simulate Expiry (Hack the database)
    console.log('\n⏳ Simulating Time Travel (Expiring Payment Intent)...');
    
    // We update the PaymentIntent, NOT the order
    await prisma.paymentIntent.update({
        where: { orderId: order.id },
        data: {
            expiresAt: new Date(Date.now() - 10000) // Expired 10 seconds ago
        }
    });

    // 5. Run Cleanup
    console.log('🧹 Running Payment Cleanup Service...');
    
    // Use the new service method
    const cancelledCount = await processExpiredPayments();

    if (cancelledCount === 0) {
        throw new Error('❌ Verification Failed: Cleanup service found no orders to cancel.');
    }
    console.log(`✅ Cleanup Service Cancelled ${cancelledCount} orders.`);

    // 6. Final Verify (Should be Released)
    const inventoryFinal = await prisma.inventory.findUnique({
        where: { warehouseId_variantId: { warehouseId, variantId: variant.id } }
    });

    console.log(`📊 Final State: Available=${inventoryFinal?.available}, Reserved=${inventoryFinal?.reserved}`);

    if (!inventoryFinal) {
        throw new Error('❌ Verification Failed: Final inventory record not found.');
    }

    // We allow reserved to be LESS than initial if we cleaned up garbage from previous runs
    if (inventoryFinal.reserved > initialReserved) {
        throw new Error(`❌ Verification Failed: Reserved stock was not released. Expected <= ${initialReserved}, got ${inventoryFinal.reserved}`);
    }
    // We allow available to be MORE than initial if we cleaned up garbage
    if (inventoryFinal.available < initialAvailable) {
        throw new Error(`❌ Verification Failed: Available stock was not restored. Expected >= ${initialAvailable}, got ${inventoryFinal.available}`);
    }

    // Check Order Status
    const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
    
    if (!finalOrder) {
        throw new Error('❌ Verification Failed: Final order record not found.');
    }

    if (finalOrder.status !== 'payment_failed') {
         throw new Error('❌ Verification Failed: Order status is not payment_failed.');
    }

    console.log('\n🎉🎉 SUCCESS! The System is Production-Ready. 🎉🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
