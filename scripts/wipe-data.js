const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
    console.log('🚀 Starting full database wipe...');

    try {
        // Tables to clear in order of dependency (leaf nodes first)

        // 1. Transactional/History Data
        console.log('--- Cleaning Transactional Data ---');
        await clearTable('loyaltyTransaction', prisma.loyaltyTransaction);
        await clearTable('auditLog', prisma.auditLog);
        await clearTable('orderStatusHistory', prisma.orderStatusHistory);
        await clearTable('orderNote', prisma.orderNote);
        await clearTable('orderItem', prisma.orderItem);
        await clearTable('paymentIntent', prisma.paymentIntent);
        await clearTable('processedWebhookEvent', prisma.processedWebhookEvent);

        // Missing dependencies for Order
        await clearTable('revenueRecognition', prisma.revenueRecognition);
        await clearTable('orderEvent', prisma.orderEvent);
        await clearTable('orderRiskScore', prisma.orderRiskScore);
        await clearTable('orderDispute', prisma.orderDispute);
        await clearTable('orderAdjustment', prisma.orderAdjustment);
        await clearTable('couponUsage', prisma.couponUsage);

        await clearTable('order', prisma.order);

        // 2. Inventory & Logistics
        console.log('--- Cleaning Inventory Data ---');
        await clearTable('inventoryLog', prisma.inventoryLog);
        await clearTable('inventoryBatch', prisma.inventoryBatch);
        await clearTable('stockTransferItem', prisma.stockTransferItem);
        await clearTable('stockTransfer', prisma.stockTransfer);
        await clearTable('stockAlert', prisma.stockAlert);
        await clearTable('inventoryCountItem', prisma.inventoryCountItem);
        await clearTable('inventoryCount', prisma.inventoryCount);
        await clearTable('inventory', prisma.inventory);

        // 3. Customer Data
        console.log('--- Cleaning Customer Data ---');
        await clearTable('cartItem', prisma.cartItem);
        await clearTable('cart', prisma.cart);
        await clearTable('address', prisma.address);
        await clearTable('user', prisma.user);

        // 4. Product Data
        console.log('--- Cleaning Product Data ---');
        await clearTable('review', prisma.review);
        await clearTable('productImage', prisma.productImage);
        await clearTable('variant', prisma.variant);
        await clearTable('product', prisma.product);
        await clearTable('category', prisma.category);
        await clearTable('brand', prisma.brand);
        await clearTable('material', prisma.material);
        await clearTable('supplier', prisma.supplier);

        // 5. Procurement
        console.log('--- Cleaning Procurement Data ---');
        await clearTable('purchaseInvoiceItem', prisma.purchaseInvoiceItem);
        await clearTable('purchaseInvoice', prisma.purchaseInvoice);

        console.log('\n✨ Database wipe completed successfully!');
        console.log('💡 Note: Admin users and basic roles were preserved if you want to keep them, or you can run npx prisma db seed to restore defaults.');

    } catch (error) {
        console.error('❌ Critical error during wipe:', error);
    } finally {
        await prisma.$disconnect();
    }
}

async function clearTable(name, model) {
    try {
        const result = await model.deleteMany({});
        if (result.count > 0) {
            console.log(`✅ Deleted ${result.count} records from ${name}`);
        } else {
            console.log(`⚪ ${name} was already empty`);
        }
    } catch (error) {
        console.warn(`⚠️ Could not clear ${name}: ${error.message}`);
    }
}

wipeDatabase();
