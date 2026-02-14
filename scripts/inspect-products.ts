
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      imageUrl: true,
      variants: {
        select: {
          price: true
        }
      },
      images: {
        select: {
          url: true
        }
      }
    },
  });

  console.log('--- Products in Database ---');
  products.forEach((p) => {
    const imagesCount = p.images.length;
    const price = p.variants[0]?.price || 'N/A';
    console.log(`ID: ${p.id} | Name: ${p.name} | Price: ${price} | ImageURL: ${p.imageUrl} | Gallery Images: ${imagesCount}`);
    if (imagesCount > 0) {
      p.images.forEach(img => console.log(`  - Gallery: ${img.url}`));
    }
  });
  console.log('---------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
