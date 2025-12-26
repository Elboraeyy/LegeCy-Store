// Script to delete all orders from the database
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllOrders() {
    console.log('🗑️  Deleting all orders...');
    
    try {
        // Get count before deletion
        const beforeCount = await prisma.order.count();
        console.log(`   Current orders: ${beforeCount}`);

        // Delete in order due to foreign key constraints
        // 1. Delete OrderNotes
        try {
            const notesCount = await prisma.orderNote.deleteMany({});
            console.log(`   ✓ Deleted ${notesCount.count} order notes`);
        } catch {
            console.log('   - No order notes table');
        }

        // 2. Delete OrderStatusHistory
        try {
            const historyCount = await prisma.orderStatusHistory.deleteMany({});
            console.log(`   ✓ Deleted ${historyCount.count} status history records`);
        } catch {
            console.log('   - No order status history table');
        }

        // 3. Delete PaymentIntents
        try {
            const paymentCount = await prisma.paymentIntent.deleteMany({});
            console.log(`   ✓ Deleted ${paymentCount.count} payment intents`);
        } catch {
            console.log('   - No payment intents table');
        }

        // 4. Delete OrderItems
        const itemsCount = await prisma.orderItem.deleteMany({});
        console.log(`   ✓ Deleted ${itemsCount.count} order items`);

        // 5. Delete all Orders
        const ordersCount = await prisma.order.deleteMany({});
        console.log(`   ✓ Deleted ${ordersCount.count} orders`);
        
        console.log('\n✅ All orders deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllOrders();
