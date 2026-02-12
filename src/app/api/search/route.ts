import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
              { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
              { nameAr: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
              { description: { contains: q, mode: 'insensitive' as Prisma.QueryMode } },
              { variants: { some: { sku: { contains: q, mode: 'insensitive' as Prisma.QueryMode } } } },
              { brand: { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } } },
              { categoryRel: { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } } },
              
              // 2. Partial match for each term (simulating fuzzy)
              ...terms.map(term => ({
                OR: [
                  { name: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
                  { nameAr: { contains: term, mode: 'insensitive' as Prisma.QueryMode } },
                  { categoryRel: { name: { contains: term, mode: 'insensitive' as Prisma.QueryMode } } }
                ]
              }))
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        nameAr: true,
        // price is on Variant, not Product
        imageUrl: true,
        category: true,
        categoryRel: {
          select: { name: true, nameAr: true }
        },
        brand: {
          select: { name: true, nameAr: true }
        },
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
      category: p.categoryRel?.name || p.category,
      brand: p.brand?.name
    }));

    return NextResponse.json({ products: formattedProducts });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
