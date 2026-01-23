"use client";

import React from "react";
import { Product } from "@/types/product";
import ModernProductCarousel from "@/components/ModernProductCarousel";

interface RelatedProductsProps {
  products: Product[];
  currentProductId: string;
}

export default function RelatedProducts({ products, currentProductId }: RelatedProductsProps) {
  // Filter out current product and get related ones
  const relatedProducts = products
    .filter(p => String(p.id) !== String(currentProductId))
    .slice(0, 10); // Increased limit as carousel can handle more

  if (relatedProducts.length === 0) return null;

  return (
    <div className="mt-8">
      <ModernProductCarousel
        products={relatedProducts}
        title="You May Also Like"
      />
    </div>
  );
}
