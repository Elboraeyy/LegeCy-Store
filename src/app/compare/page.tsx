"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { useComparison } from "@/context/ComparisonContext";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import ProductSelectionModal from "@/components/ProductSelectionModal";

import { useRouter, useSearchParams } from "next/navigation";

type ProductId = string | number;

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromLabel = searchParams.get("fromLabel") || "Shop";
  const { selectedProducts, removeFromCompare, addToCompare } = useComparison();
  const { addToCart } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [replacingId, setReplacingId] = useState<ProductId | null>(null);

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  const handleOpenModal = (replaceId?: ProductId) => {
    setReplacingId(replaceId || null);
    setIsModalOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    if (replacingId) {
        removeFromCompare(replacingId);
        addToCompare(product);
    } else {
        addToCompare(product);
    }
    setIsModalOpen(false);
    setReplacingId(null);
  };

  if (selectedProducts.length === 0) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <h1 style={{ marginBottom: "24px" }}>No Products to Compare</h1>
        <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Select products from the shop to compare them side-by-side.</p>
        <Link href="/shop" className="btn btn-primary">Go to Shop</Link>
      </main>
    );
  }

  // Ensure we always have 3 slots logic for table stability if desired, or just map active ones + add button
  const slots: (Product | { isPlaceholder: boolean })[] = [...selectedProducts];
  if(slots.length < 3) {
      slots.push({ isPlaceholder: true });
  }

  return (
    <main>
      <section className="shop-hero" style={{ marginBottom: "60px" }}>
        <div className="container">
          <Reveal>
             <h1>Compare Watches</h1>
          </Reveal>
          <Reveal delay={0.2}>
             <p>Compare specifications side by side to find your perfect timepiece.</p>
          </Reveal>
        </div>
      </section>

      <section className="container">
        <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: "40px" }}>
            <button 
                onClick={() => router.back()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid var(--border-light)', borderRadius: '50%', color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5"></path>
                    <path d="M12 19l-7-7 7-7"></path>
                </svg>
            </button>
            <Link href="/shop" style={{ color: 'var(--text-on-light)', textDecoration: 'none', fontWeight: 500 }}>{fromLabel}</Link> / <span style={{ color: 'var(--text-muted)' }}>Compare Watches</span>
        </div>

        <ProductSelectionModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleSelectProduct}
          excludeProductIds={selectedProducts.map(p => p.id)}
        />
        
        <div className="comparison-table-wrapper" style={{ overflowX: "auto", paddingBottom: "24px" }}>
          <table className="comparison-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "16px 0", minWidth: "800px" }}>
          <thead>
            <tr>
              <th style={{ padding: "24px", textAlign: "left", verticalAlign: "middle", width: "20%" }}>
                <span style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Specifications</span>
              </th>
              {slots.map((product, idx) => {
                  if('isPlaceholder' in product) {
                      return (
                          <th key={`placeholder-${idx}`} style={{ 
                              padding: "24px", width: "26%", verticalAlign: "middle", 
                              border: "2px dashed var(--border-light)", borderRadius: "12px",
                              textAlign: "center"
                           }}>
                              <div style={{ padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                                  <span style={{ color: "var(--text-muted)" }}>Add another watch</span>
                                  <button onClick={() => handleOpenModal()} className="btn-icon" style={{ width: "48px", height: "48px" }}>
                                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                          <line x1="12" y1="5" x2="12" y2="19"></line>
                                          <line x1="5" y1="12" x2="19" y2="12"></line>
                                      </svg>
                                  </button>
                              </div>
                          </th>
                      );
                  }
                  
                  return (
                    <th key={product.id} style={{ 
                        padding: "24px", width: "26%", verticalAlign: "bottom", position: "relative",
                        background: "var(--surface)", borderRadius: "12px 12px 0 0",
                        border: "1px solid var(--border-light)", borderBottom: "none"
                    }}>
                    <div style={{ position: "relative", marginBottom: "16px", cursor: "pointer" }}>
                        <Link href={`/product/${product.id}`}>
                            <div style={{ position: "relative", aspectRatio: "3/4", width: "100%", maxWidth: "180px", margin: "0 auto", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
                            <Image src={product.imageUrl || product.img || '/placeholder.jpg'} alt={product.name} fill className="object-cover" />
                            </div>
                        </Link>
                        
                        <div style={{ position: "absolute", top: 0, right: "calc(50% - 100px)", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button 
                            onClick={() => removeFromCompare(product.id)}
                            className="btn-icon"
                            style={{ width: "32px", height: "32px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            title="Remove"
                            >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            </button>
                             <button 
                            onClick={() => handleOpenModal(product.id)}
                            className="btn-icon"
                            style={{ width: "32px", height: "32px", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                            title="Change Product"
                            >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                            </button>
                        </div>

                        <h3 style={{ fontSize: "16px", marginBottom: "8px", minHeight: "44px" }}>
                            <Link href={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {product.name}
                            </Link>
                        </h3>
                        <p style={{ fontSize: "16px", fontWeight: "600", color: "var(--primary)" }}>{formatPrice(product.price)}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                        <button onClick={() => addToCart(String(product.id))} className="btn btn-primary btn-block" style={{ fontSize: "12px", padding: "10px" }}>Add to Cart</button>
                    </div>
                    </th>
                  );
              })}
            </tr>
          </thead>
          <tbody>
            {(
              [
                { label: "Brand", key: "brand" },
                { label: "Strap", key: "strap" },
                { label: "Movement", specKey: "movement" },
                { label: "Case", specKey: "case" },
                { label: "Water", specKey: "waterResistance" },
                { label: "Glass", specKey: "glass" },
              ] as const
            ).map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: "24px", fontWeight: "600", color: "var(--text-primary)", borderBottom: "1px solid var(--border-light)" }}>{row.label}</td>
                {slots.map((product, pIdx) => {
                   if('isPlaceholder' in product) return <td key={`ph-${pIdx}`} style={{ borderBottom: "1px solid transparent" }}></td>;
                   
                  let value: string | undefined = "-";
                  if ('key' in row) value = (product as unknown as Record<string, string | undefined>)[row.key];
                  else if ('specKey' in row) {
                    if (product.specs) value = product.specs[row.specKey] ?? '-';
                    else {
                      if (row.specKey === "movement") value = "Automatic";
                      if (row.specKey === "case") value = "Steel";
                      if (row.specKey === "waterResistance") value = "5 ATM";
                      if (row.specKey === "glass") value = "Mineral";
                    }
                  }

                  return (
                    <td key={product.id} style={{ 
                        padding: "24px", color: "var(--text-muted)", verticalAlign: "top",
                        background: "var(--surface)", borderLeft: "1px solid var(--border-light)", borderRight: "1px solid var(--border-light)",
                        borderBottom: idx === 5 ? "1px solid var(--border-light)" : "1px solid rgba(0,0,0,0.05)",
                        ...(idx === 5 ? { borderRadius: "0 0 12px 12px" } : {})
                    }}>
                      {value || "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </section>
    </main>
  );
}
