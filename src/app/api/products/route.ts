import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filter parameters
    const category = searchParams.get("category");
    const brands = searchParams.get("brands");
    const materials = searchParams.get("materials");
    const search = searchParams.get("q");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const onSale = searchParams.get("onSale");
    const isNew = searchParams.get("new");

    // Build where clause
    const where: Record<string, unknown> = {
      status: "active",
    };

    // Category filter
    if (category) {
      const categorySlugs = category.split(",").filter(Boolean);
      if (categorySlugs.length > 0) {
        const categories = await prisma.category.findMany({
          where: { slug: { in: categorySlugs } },
          select: { id: true },
        });
        where.categoryId = { in: categories.map(c => c.id) };
      }
    }

    // Brand filter
    if (brands) {
      const brandIds = brands.split(",").filter(Boolean);
      if (brandIds.length > 0) {
        where.brandId = { in: brandIds };
      }
    }

    // Material filter
    if (materials) {
      const materialIds = materials.split(",").filter(Boolean);
      if (materialIds.length > 0) {
        where.materialId = { in: materialIds };
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // On sale filter
    if (onSale === "true") {
      where.compareAtPrice = { not: null };
    }

    // Fetch products with variants for price
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        variants: {
          take: 1,
          orderBy: { createdAt: "asc" },
          include: {
            inventory: {
              select: { available: true },
            },
          },
        },
        brand: { select: { name: true } },
        categoryRel: { select: { name: true, slug: true } },
      },
    });

    // Transform and apply client-side filters
    let transformedProducts = products.map(p => {
      const firstVariant = p.variants[0];
      const price = firstVariant ? Number(firstVariant.price) : 0;
      const totalStock = firstVariant?.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;
      const inStockStatus = totalStock > 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        imageUrl: p.imageUrl,
        img: p.imageUrl,
        inStock: inStockStatus,
        isNew: false,
        category: p.categoryRel?.name || p.category,
        categorySlug: p.categoryRel?.slug,
        brand: p.brand?.name,
        totalStock,
        createdAt: p.createdAt.toISOString(),
      };
    });

    // Apply price filter (client-side since price comes from variants)
    if (minPrice) {
      const min = Number(minPrice);
      transformedProducts = transformedProducts.filter(p => p.price >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      transformedProducts = transformedProducts.filter(p => p.price <= max);
    }

    // Apply stock filter
    if (inStock === "true") {
      transformedProducts = transformedProducts.filter(p => p.inStock);
    } else if (inStock === "false") {
      transformedProducts = transformedProducts.filter(p => !p.inStock);
    }

    // Apply on sale filter (must have compareAtPrice > price)
    if (onSale === "true") {
      transformedProducts = transformedProducts.filter(
        p => p.compareAtPrice && p.compareAtPrice > p.price
      );
    }

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
    });
  } catch (error) {
    console.error("Products API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
