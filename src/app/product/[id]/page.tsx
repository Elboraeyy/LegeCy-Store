import type { Metadata } from "next";
import ProductDetailsClient, { ProductData } from "./ProductDetailsClient";
import prisma from "@/lib/prisma";
import { applyActiveOffersToProducts } from "@/lib/services/discountService";
import { fetchProductReviews } from "@/lib/actions/reviews";
import { getStoreSettings } from "@/lib/actions/settings";
import { notFound } from "next/navigation";
import { Product } from "@/types/product";

type Props = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string): Promise<ProductData | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          take: 1,
          orderBy: { createdAt: "asc" },
          include: {
            inventory: {
              select: { available: true, minStock: true },
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

    if (!product) return null;

    const firstVariant = product.variants[0];
    const price = firstVariant ? Number(firstVariant.price) : 0;
    const totalStock = firstVariant?.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;

    const transformedProduct: ProductData = {
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
      categorySlug: product.categoryRel?.slug || undefined,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        nameAr: undefined,
        slug: product.brand.slug
      } : null,
      material: product.material,
      totalStock,
      sku: firstVariant?.sku || null,
      createdAt: product.createdAt.toISOString(),
      detailTags: product.detailTags,
      defaultVariantId: firstVariant?.id || null,
      variants: product.variants.map((v) => ({
        id: v.id,
        name: product.name,
        price: Number(v.price),
        stock: v.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0,
        sku: v.sku,
      })),
      similarProducts: [] as Product[],
      specs: product.specs as ProductData["specs"],
    };

    const productsWithOffers = await applyActiveOffersToProducts([transformedProduct]);
    const finalProduct = productsWithOffers[0];

    // Build similar products
    const rawSimilar = (product.orderedSimilarIds && product.orderedSimilarIds.length > 0)
      ? product.orderedSimilarIds
          .map((sId) => product.similarProducts.find(p => p.id === sId))
          .filter((p): p is typeof product.similarProducts[0] => !!p)
      : product.similarProducts;

    const mappedSimilar = rawSimilar.map((p) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.imageUrl,
      price: p.variants?.[0]?.price ? Number(p.variants[0].price) : 0,
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      category: p.category,
      brand: p.brand?.name || null,
      detailTags: p.detailTags,
      inStock: true,
    }));

    if (mappedSimilar.length > 0) {
      finalProduct.similarProducts = await applyActiveOffersToProducts(mappedSimilar);
    } else {
      finalProduct.similarProducts = [];
    }

    return finalProduct;
  } catch (error) {
    console.error("Server fetch product error:", error);
    return null;
  }
}

async function getRelatedProducts(categoryId: string | null, productId: string): Promise<Product[]> {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "active",
        id: { not: productId },
        categoryId: categoryId || undefined,
      },
      take: 20,
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
      },
    });

    const transformed = products.map((p) => {
      const firstVariant = p.variants[0];
      const price = firstVariant ? Number(firstVariant.price) : 0;
      const totalStock = firstVariant?.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price,
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        imageUrl: p.imageUrl,
        category: p.categoryRel?.name || p.category,
        brand: p.brand?.name || null,
        inStock: totalStock > 0,
      };
    });

    const withOffers = await applyActiveOffersToProducts(transformed);
    return withOffers.sort(() => Math.random() - 0.5).slice(0, 8);
  } catch (error) {
    console.error("Server fetch related products error:", error);
    return [];
  }
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, description: true }
  });

  if (!product) {
    return {
      title: "Product Not Found | Legacy Store",
    };
  }

  return {
    title: `${product.name} | Legacy Store`,
    description: product.description || `Buy ${product.name}. Premium luxury timepiece.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;

  // Fetch all necessary data in parallel directly on the server (low latency)
  const productPromise = getProduct(id);
  const reviewsPromise = fetchProductReviews(id);
  const settingsPromise = getStoreSettings(["FREE_SHIPPING_ENABLED", "FREE_SHIPPING_THRESHOLD"]);

  const [product, reviews, settings] = await Promise.all([
    productPromise,
    reviewsPromise,
    settingsPromise,
  ]);

  if (!product) {
    notFound();
  }

  // Fetch related products based on category
  const relatedProducts = await getRelatedProducts(product.categoryId, id);

  const showFreeShipping = settings["FREE_SHIPPING_ENABLED"] === "true";
  const shippingThreshold = settings["FREE_SHIPPING_THRESHOLD"] || "1000";

  return (
    <ProductDetailsClient
      id={id}
      initialProduct={product}
      initialReviews={reviews}
      initialRelatedProducts={relatedProducts}
      initialShowFreeShipping={showFreeShipping}
      initialShippingThreshold={shippingThreshold}
    />
  );
}
