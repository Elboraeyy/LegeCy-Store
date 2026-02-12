"use server";

import prisma from "@/lib/prisma";

export async function createSharedWishlist(productIds: string[]) {
  try {
    const shared = await prisma.sharedWishlist.create({
      data: {
        products: productIds,
      },
    });
    return { success: true, id: shared.id };
  } catch (error) {
    console.error("Failed to create shared wishlist", error);
    return { success: false, error: "Failed to share wishlist" };
  }
}

export async function getSharedWishlist(id: string) {
  try {
      const shared = await prisma.sharedWishlist.findUnique({
          where: { id },
      });
      if (!shared) return null;

      const products = await prisma.product.findMany({
          where: {
              id: { in: shared.products },
          },
          select: {
              id: true,
              name: true,
              imageUrl: true,
              variants: {
                  take: 1,
                  select: { price: true, sku: true, inventory: true }
              },
              categoryRel: { select: { name: true } },
              brand: { select: { name: true } }
          }
      });
      
      // Map to frontend product structure
      return products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.variants[0]?.price || 0),
          img: p.imageUrl,
          imageUrl: p.imageUrl,
          category: p.categoryRel?.name,
          brand: p.brand?.name,
          inStock: (p.variants[0]?.inventory?.reduce((acc, i) => acc + i.available, 0) || 0) > 0,
          variants: [] // minimal needed
      }));

  } catch (error) {
      console.error("Failed to fetch shared wishlist", error);
      return null;
  }
}
