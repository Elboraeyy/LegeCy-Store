import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
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
        brand: { select: { id: true, name: true, slug: true } },
        material: { select: { id: true, name: true } },
        categoryRel: { select: { id: true, name: true, slug: true } },
        images: { select: { url: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const firstVariant = product.variants[0];
    const price = firstVariant ? Number(firstVariant.price) : 0;
    const totalStock = firstVariant?.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;

    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      detailedDescription: product.detailedDescription,
      price,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      imageUrl: product.imageUrl,
      images: product.images.map(img => img.url),
      category: product.categoryRel?.name || product.category,
      categoryId: product.categoryRel?.id || product.categoryId,
      categorySlug: product.categoryRel?.slug,
      brand: product.brand,
      material: product.material,
      totalStock,
      sku: firstVariant?.sku || null,
      inStock: totalStock > 0,
      createdAt: product.createdAt.toISOString(),
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Product API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
