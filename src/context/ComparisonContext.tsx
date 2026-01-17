"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Product } from "@/types/product";

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

  // Load from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("comparison_products");
    if (saved) {
      try {
        setSelectedProducts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse comparison data", e);
      }
    }
  }, []);

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
