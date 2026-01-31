import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { fetchAllCategories } from "@/lib/actions/category";
import { fetchAllBrands } from "@/lib/actions/brand";
import { fetchAllMaterials } from "@/lib/actions/material";
import prisma from "@/lib/prisma";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Shop Premium Accessories | Legacy Store",
  description: "Browse our full collection of premium accessories - watches, wallets, sunglasses, perfumes, handbags and more.",
};

export default async function Shop() {
  // Fetch server-side data for SEO and initial render
  const [categories, brands, materials, products] = await Promise.all([
    fetchAllCategories(),
    fetchAllBrands(),
    fetchAllMaterials(),
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      where: { status: 'active' },
      include: {
        variants: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          include: {
            inventory: true
          }
        },
        categoryRel: { select: { slug: true } },
      },
    }),
  ]);

  return (
    <ShopClient
      initialProducts={products.map(p => {
        const firstVariant = p.variants[0];
        const price = firstVariant ? Number(firstVariant.price) : 0;
        const totalStock = firstVariant?.inventory?.reduce((sum, inv) => sum + inv.available, 0) ?? 0;

        return {
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          price,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          imageUrl: p.imageUrl || undefined,
          img: p.imageUrl || undefined,
          inStock: totalStock > 0,
          totalStock,
          isNew: false, // Can be enhanced with metadata later
          createdAt: p.createdAt.toISOString(),
          // Filter fields
          categoryId: p.categoryId,
          brandId: p.brandId,
          materialId: p.materialId,
          categorySlug: p.categoryRel?.slug,
        };
      })}
      categories={categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))}
      brands={brands.map(b => ({
        id: b.id,
        name: b.name,
      }))}
      materials={materials.map(m => ({
        id: m.id,
        name: m.name,
      }))}
    />
  );
}
