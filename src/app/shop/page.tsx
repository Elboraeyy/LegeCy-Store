import type { Metadata } from "next";
import ShopClient from "./ShopClient";
import { fetchAllCategories } from "@/lib/actions/category";
import { fetchAllBrands } from "@/lib/actions/brand";
import { fetchAllMaterials } from "@/lib/actions/material";
import { fetchShopProducts } from "@/lib/actions/shop";

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Shop Premium Accessories | Legacy Store",
    description: "Browse our full collection of premium accessories - watches, wallets, sunglasses, perfumes, handbags and more. Filter by category, brand, price, and more.",
    keywords: "shop, accessories, watches, wallets, sunglasses, perfumes, handbags, legacy store, egypt",
    openGraph: {
      title: "Shop Premium Accessories | Legacy Store",
      description: "Browse our full collection of premium accessories - watches, wallets, sunglasses, perfumes, handbags and more.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Shop Premium Accessories | Legacy Store",
      description: "Browse our full collection of premium accessories - watches, wallets, sunglasses, perfumes, handbags and more.",
    },
    alternates: {
      canonical: "/shop",
    },
  };
}

export default async function Shop() {
  // Fetch server-side data for SEO and initial render
  // fetchShopProducts already shuffles the products for random display
  const [categories, brands, materials, shopProducts] = await Promise.all([
    fetchAllCategories(),
    fetchAllBrands(),
    fetchAllMaterials(),
    fetchShopProducts(),
  ]);

  return (
    <ShopClient
      initialProducts={shopProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice || undefined,
        imageUrl: p.imageUrl || undefined,
        img: p.imageUrl || undefined,
        inStock: p.inStock,
        totalStock: p.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0,
        isNew: p.isNew ?? false,
        createdAt: new Date().toISOString(),
        category: p.category,
        categoryId: undefined,
        brandId: undefined,
        materialId: undefined,
        categorySlug: p.category,
        sku: p.variants?.[0]?.sku,
        brandName: p.brand,
        categoryName: p.category,
      }))}
      categories={categories.map(c => ({
        id: c.id,
        name: c.name,
        nameAr: c.nameAr,
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
