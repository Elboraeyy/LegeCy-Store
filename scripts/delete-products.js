// Script to delete all products from the database
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllProducts() {
    console.log('🗑️  Deleting all products...');
    
    try {
        // Delete in order due to foreign key constraints
        const inventoryCount = await prisma.inventory.deleteMany({});
        console.log(`   ✓ Deleted ${inventoryCount.count} inventory records`);
        
        const variantCount = await prisma.variant.deleteMany({});
        console.log(`   ✓ Deleted ${variantCount.count} variants`);
        
        const imageCount = await prisma.productImage.deleteMany({});
        console.log(`   ✓ Deleted ${imageCount.count} product images`);
        
        const productCount = await prisma.product.deleteMany({});
        console.log(`   ✓ Deleted ${productCount.count} products`);
        
        console.log('\n✅ All products deleted successfully!');
    } catch (error) {
        console.error('❌ Error deleting products:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteAllProducts();
