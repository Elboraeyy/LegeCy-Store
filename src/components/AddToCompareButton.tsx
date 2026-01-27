"use client";

import React from "react";
import { useComparison } from "@/context/ComparisonContext";
import { Product } from "@/types/product";
import { CompareIcon } from "@/components/icons/CompareIcon";

import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { useLanguage } from "@/context/LanguageContext";

interface AddToCompareButtonProps {
  product: Product;
  className?: string;
  showText?: boolean;
}

export default function AddToCompareButton({ product, className = "", showText = false }: AddToCompareButtonProps) {
  const router = useRouter();
  const { isInComparison, addToCompare, removeFromCompare } = useComparison();
  const isClient = useIsClient();
  const { t } = useLanguage();
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
      title={isAdded ? t.common.removeFromCompare : t.common.addToCompare}
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
      <CompareIcon width={20} height={20} className={showText ? "" : "w-5 h-5"} strokeWidth={1.5} />
      {showText && <span>{isAdded ? t.common.addedToCompare : t.common.compare}</span>}
    </button>
  );
}
