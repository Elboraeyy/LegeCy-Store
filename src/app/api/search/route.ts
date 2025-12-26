import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  try {
    // Perform a flexible search
    // We split the query into words to allow finding "Galaxy S24" even if user types "S24 Galaxy"
    const terms = q.split(' ').filter(t => t.length > 0);

    const products = await prisma.product.findMany({
      where: {
        AND: [
          { status: 'active' },
          {
            OR: [
              // 1. Exact match logic (for SKU or exact name)
              { name: { contains: q } },
              { description: { contains: q } },
              { variants: { some: { sku: { contains: q } } } },
              
              // 2. Partial match for each term (simulating fuzzy)
              ...terms.map(term => ({
                OR: [
                  { name: { contains: term } },
                  { category: { contains: term } }
                ]
              }))
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        // price is on Variant, not Product
        imageUrl: true,
        category: true,
        variants: {
          take: 1,
          select: { price: true }
        }
      },
      take: 8, // Limit results for dropdown
      orderBy: {
        createdAt: 'desc' // Tie-breaker
      }
    });

    // Format results
    const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.variants[0]?.price ? Number(p.variants[0].price) : 0, 
        image: p.imageUrl,
        category: p.category
    }));

    return NextResponse.json({ products: formattedProducts });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
