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
        categoryRel: { select: { id: true, name: true, slug: true, nameAr: true } },
        images: { select: { url: true } },
        similarProducts: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            compareAtPrice: true,
            category: true,
            detailTags: true,
            brand: { select: { name: true, slug: true } },
            variants: {
              take: 1,
              select: { price: true }
            }
          }
        }
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
      nameAr: product.nameAr,
      description: product.description,
      descriptionAr: product.descriptionAr,
      detailedDescription: product.detailedDescription,
      detailedDescriptionAr: product.detailedDescriptionAr,
      price,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      imageUrl: product.imageUrl,
      images: product.images.map(img => img.url),
      category: product.categoryRel?.name || product.category,
      categoryAr: product.categoryRel?.nameAr || null,
      categoryId: product.categoryRel?.id || product.categoryId,
      categorySlug: product.categoryRel?.slug,
      brand: product.brand,
      material: product.material,
      totalStock,
      sku: firstVariant?.sku || null,
      inStock: totalStock > 0,
      createdAt: product.createdAt.toISOString(),
      detailTags: product.detailTags,
      orderedSimilarIds: (product as any).orderedSimilarIds || [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      specs: (product as any).specs as any, // Cast to any to avoid strict type checks on Json type
      similarProducts: ((product as any).orderedSimilarIds && (product as any).orderedSimilarIds.length > 0)
        ? (product as any).orderedSimilarIds
            .map((id: string) => product.similarProducts.find(p => p.id === id))
            .filter((p: any): p is typeof product.similarProducts[0] => !!p)
            .map((p: any) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                price: p.variants?.[0]?.price ? Number(p.variants[0].price) : 0,
                compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                category: p.category,
                brand: p.brand?.name,
                detailTags: p.detailTags
            }))
        : product.similarProducts.map((p: any) => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            price: p.variants?.[0]?.price ? Number(p.variants[0].price) : 0,
            compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
            category: p.category,
            brand: p.brand?.name,
            detailTags: p.detailTags
          })),
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
