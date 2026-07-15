import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import {
  getPrimaryVariant,
  getPrimaryVariantId,
  getPrimaryVariantStock,
} from "@/lib/products/primary-variant";

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

    // Build where clause
    const where: Record<string, unknown> = {
      status: "active",
    };

    let useCustomOrder = false;
    let customSortField:
      | "sortInCategory"
      | "sortInBrand"
      | "sortInMaterial"
      | null = null;

    // Category filter
    if (category) {
      const categorySlugs = category.split(",").filter(Boolean);
      if (categorySlugs.length === 1) {
        const cat = await prisma.category.findUnique({
          where: { slug: categorySlugs[0] },
          select: { id: true, useCustomOrder: true },
        });
        if (cat) {
          where.categoryId = cat.id;
          if (cat.useCustomOrder) {
            useCustomOrder = true;
            customSortField = "sortInCategory";
          }
        }
      } else if (categorySlugs.length > 1) {
        const categories = await prisma.category.findMany({
          where: { slug: { in: categorySlugs } },
          select: { id: true },
        });
        where.categoryId = { in: categories.map((c) => c.id) };
      }
    }

    // Brand filter
    if (brands) {
      const brandIds = brands.split(",").filter(Boolean);
      if (brandIds.length === 1) {
        const brand = await prisma.brand.findUnique({
          where: { id: brandIds[0] },
          select: { id: true, useCustomOrder: true },
        });
        if (brand) {
          where.brandId = brand.id;
          if (brand.useCustomOrder && !useCustomOrder) {
            useCustomOrder = true;
            customSortField = "sortInBrand";
          }
        }
      } else if (brandIds.length > 1) {
        where.brandId = { in: brandIds };
      }
    }

    // Material filter
    if (materials) {
      const materialIds = materials.split(",").filter(Boolean);
      if (materialIds.length === 1) {
        const material = await prisma.material.findUnique({
          where: { id: materialIds[0] },
          select: { id: true, useCustomOrder: true },
        });
        if (material) {
          where.materialId = material.id;
          if (material.useCustomOrder && !useCustomOrder) {
            useCustomOrder = true;
            customSortField = "sortInMaterial";
          }
        }
      } else if (materialIds.length > 1) {
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

    // Determine order
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [];
    if (useCustomOrder && customSortField) {
      orderBy.push({ [customSortField]: "asc" });
    }
    orderBy.push({ createdAt: "desc" });

    // Fetch products with variants for price
    const products = await prisma.product.findMany({
      where,
      orderBy,
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
        categoryRel: { select: { name: true, nameAr: true, slug: true } },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Transform and apply client-side filters
    let transformedProducts = products.map((p) => {
      const firstVariant = getPrimaryVariant(p.variants);
      const price = firstVariant ? Number(firstVariant.price) : 0;
      const totalStock = getPrimaryVariantStock(p.variants);
      const inStockStatus = totalStock > 0;

      const reviewsList = p.reviews || [];
      const reviewsCount = reviewsList.length;
      const rating = reviewsCount > 0 
        ? reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsCount 
        : 5;

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
        categoryAr: p.categoryRel?.nameAr || null,
        categorySlug: p.categoryRel?.slug,
        brand: p.brand?.name,
        defaultVariantId: getPrimaryVariantId(p.variants),
        sku: firstVariant?.sku || null,
        totalStock,
        createdAt: p.createdAt.toISOString(),
        detailTags: p.detailTags,
        rating,
        reviewsCount,
      };
    });

    // Apply price filter (client-side since price comes from variants)
    if (minPrice) {
      const min = Number(minPrice);
      transformedProducts = transformedProducts.filter((p) => p.price >= min);
    }
    if (maxPrice) {
      const max = Number(maxPrice);
      transformedProducts = transformedProducts.filter((p) => p.price <= max);
    }

    // Apply stock filter
    if (inStock === "true") {
      transformedProducts = transformedProducts.filter((p) => p.inStock);
    } else if (inStock === "false") {
      transformedProducts = transformedProducts.filter((p) => !p.inStock);
    }

    // Apply on sale filter (must have compareAtPrice > price)
    if (onSale === "true") {
      transformedProducts = transformedProducts.filter(
        (p) => p.compareAtPrice && p.compareAtPrice > p.price,
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
      { status: 500 },
    );
  }
}
