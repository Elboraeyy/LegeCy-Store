
import prisma from '../lib/prisma';

async function main() {
  try {
    const order = await prisma.order.findFirst({
      where: { orderNumber: 'A020' },
      include: {
        items: true
      }
    });

    console.log('Order found:', order ? order.id : 'NOT FOUND');
    if (order) {
        console.log('Order Status:', order.status);
        console.log('Order Items:', JSON.stringify(order.items, null, 2));
    }

    const variantId = 'e79e559e-c35f-4632-a7bb-1a5012fc53e9'; // From user log
    const variant = await prisma.variant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });
    
    if (variant) {
        console.log('------------------------------------------------');
        console.log(`Variant Details for ${variantId}:`);
        console.log(`Product Name: ${variant.product.name}`);
        console.log(`SKU: ${variant.sku}`);
        console.log(`Price: ${variant.price}`);
    } else {
        console.log(`Variant ${variantId} NOT FOUND`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
