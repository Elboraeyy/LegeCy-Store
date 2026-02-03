"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";

type ProductId = string | number;

interface ComparisonContextType {
  selectedProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: ProductId) => void;
  clearComparison: () => void;
  isInComparison: (productId: ProductId) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const { products } = useStore(); // Access active products

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("comparison_products");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelectedProducts(parsed);
      } catch (e) {
        console.error("Failed to parse comparison data", e);
      }
    }
  }, []);

  // Sync with active products to remove stale items
  React.useEffect(() => {
    if (products.length > 0 && selectedProducts.length > 0) {
      const activeIds = new Set(products.map(p => p.id));
      const validProducts = selectedProducts.filter(p => activeIds.has(String(p.id)));

      if (validProducts.length !== selectedProducts.length) {
        console.log("[Comparison] Removing stale products", selectedProducts.length - validProducts.length);
        setSelectedProducts(validProducts);
      }
    }
  }, [products, selectedProducts.length]); // Check when products load or selection changes

  // Save to localStorage whenever selectedProducts changes
  React.useEffect(() => {
    localStorage.setItem("comparison_products", JSON.stringify(selectedProducts));
  }, [selectedProducts]);

  const addToCompare = (product: Product) => {
    if (selectedProducts.length >= 5) {
      alert("You can compare up to 5 products only.");
      return;
    }
    if (selectedProducts.find((p) => String(p.id) === String(product.id))) {
      alert("Product is already in comparison.");
      return;
    }
    setSelectedProducts((prev) => [...prev, product]);
  };

  const removeFromCompare = (productId: ProductId) => {
    setSelectedProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
  };

  const clearComparison = () => {
    setSelectedProducts([]);
  };

  const isInComparison = (productId: ProductId) => {
    return selectedProducts.some((p) => String(p.id) === String(productId));
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedProducts,
        addToCompare,
        removeFromCompare,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}
