import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { fetchAllCategories } from "@/lib/actions/category";
import { fetchAllBrands } from "@/lib/actions/brand";
import { fetchAllMaterials } from "@/lib/actions/material";
import prisma from "@/lib/prisma";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export const metadata: Metadata = {
  title: "Shop Luxury Watches | Legacy Store",
  description: "Browse our full collection of luxury, classic, and sport watches.",
};

export default async function Shop() {
  // Fetch server-side data for SEO and initial render
  const [categories, brands, materials, products] = await Promise.all([
    fetchAllCategories(),
    fetchAllBrands(),
    fetchAllMaterials(),
    prisma.product.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      where: { status: 'active' },
      include: {
        variants: {
          take: 1,
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
  ]);

  return (
    <ShopClient
      initialProducts={products.map(p => {
        const firstVariant = p.variants[0];
        return {
          id: p.id,
          name: p.name,
          description: p.description || undefined,
          price: firstVariant ? Number(firstVariant.price) : 0,
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : undefined,
          imageUrl: p.imageUrl || undefined,
          img: p.imageUrl || undefined,
          inStock: true, // Will check variant inventory in API
          isNew: false, // Can be enhanced with metadata later
          createdAt: p.createdAt.toISOString(),
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
