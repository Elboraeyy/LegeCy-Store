"use client";

import React from "react";
import { useComparison } from "@/context/ComparisonContext";
import { Product } from "@/types/product";

import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";

interface AddToCompareButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

export default function AddToCompareButton({ product, className = "", showText = false }: AddToCompareButtonProps) {
  const router = useRouter();
  const { isInComparison, addToCompare, removeFromCompare } = useComparison();
  const isClient = useIsClient();
  const isAdded = isClient && isInComparison(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAdded) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
      router.push(`/compare?fromLabel=${encodeURIComponent(product.name)}`);
    }
  };

  const baseClass = showText ? "btn" : "btn-icon";
  const activeClass = isAdded ? "active" : "";
  const combinedClass = `${baseClass} ${activeClass} ${className}`.trim();

  return (
    <button
      onClick={handleClick}
      className={combinedClass}
      title={isAdded ? "Remove from Compare" : "Add to Compare"}
      style={{
         ...(!showText && isAdded ? { color: "var(--primary)", borderColor: "var(--primary)" } : {}),
         ...(showText ? { 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: "8px",
            ...(isAdded ? { 
                background: "var(--primary)", 
                color: "#fff", 
                borderColor: "var(--primary)" 
            } : {})
         } : {})
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 3v18L2 15"/>
        <path d="M16 21V3l6 6"/>
      </svg>
      {showText && <span>{isAdded ? "Added to Compare" : "Compare"}</span>}
    </button>
  );
}
