"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useComparison } from "@/context/ComparisonContext";
import { useStore } from "@/context/StoreContext";
import ProductSelectionModal from "@/components/ProductSelectionModal";
import ComparisonTable from "./components/ComparisonTable";
import MobileComparisonView from "./components/MobileComparisonView";
import EmptyState from "./components/EmptyState";
import { Product } from "@/types/product";
import { ShopProduct } from "@/lib/actions/shop";

type ProductId = string | number;

interface CompareClientProps {
    suggestions: ShopProduct[];
}

export default function CompareClient({ suggestions: _suggestions }: CompareClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromLabel = searchParams.get("fromLabel");
    const { selectedProducts, removeFromCompare, addToCompare } = useComparison();
    const { addToCart } = useStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [replacingId, setReplacingId] = useState<ProductId | null>(null);

    // Responsive check for mobile
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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

    const hasProducts = selectedProducts.length > 0;

    // Convert ShopProduct to Product for compatibility
    // const normalizedSuggestions = suggestions.map(s => ({
    //     ...s,
    // })) as unknown as Product[];

    return (
        <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#12403C] to-[#0E3330] text-center py-8 md:py-12 mb-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-normal mb-2 text-[#FCF8F3] tracking-wide">
                        Compare Watches
                    </h1>
                    <p className="text-xs sm:text-sm text-[#FCF8F3]/70 max-w-xl mx-auto">
                        Analyze specifications, features, and prices side by side to make the perfect choice.
                    </p>
                </div>
            </div>

            <section className="container" style={{ paddingBottom: "80px" }}>
                {/* Breadcrumb - Hidden on Mobile */}
                {!isMobile && (
                    <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: "32px" }}>
                        <>
                            <button
                                onClick={() => {
                                    if (fromLabel) {
                                        router.back();
                                    } else {
                                        router.push('/shop');
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '32px', height: '32px',
                                    borderRadius: '50%',
                                    border: '1px solid var(--border)',
                                    background: 'rgba(18, 64, 60, 0.03)',
                                    color: "var(--primary)",
                                    cursor: 'pointer',
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = "var(--primary)";
                                    e.currentTarget.style.background = "rgba(18, 64, 60, 0.08)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = "var(--border)";
                                    e.currentTarget.style.background = "rgba(18, 64, 60, 0.03)";
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5"></path>
                                    <path d="M12 19l-7-7 7-7"></path>
                                </svg>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600 }}>
                                {fromLabel ? (
                                    <Link href="#" onClick={(e) => { e.preventDefault(); router.back(); }} style={{ color: 'var(--primary)', textDecoration: 'none', fontFamily: "var(--font-heading)" }}>
                                        {fromLabel}
                                    </Link>
                                ) : (
                                    <Link href="/shop" style={{ color: 'var(--primary)', textDecoration: 'none', fontFamily: "var(--font-heading)" }}>
                                        Shop
                                    </Link>
                                )}
                                <span style={{ color: "var(--border)" }}>/</span>
                                <span style={{ color: 'var(--text-muted)', fontFamily: "var(--font-heading)" }}>COMPARE WATCHES</span>
                            </div>
                        </>
                    </div>
                )}

                {/* Modal */}
                <ProductSelectionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={handleSelectProduct}
                    excludeProductIds={selectedProducts.map(p => p.id)}
                />

                {/* Content - Responsive */}
                {!hasProducts ? (
                    <EmptyState onStartShopping={() => router.push("/shop")} />
                ) : isMobile ? (
                    <MobileComparisonView
                        products={selectedProducts}
                        onRemove={removeFromCompare}
                        onAddSlot={() => handleOpenModal()}
                        addToCart={addToCart}
                    />
                ) : (
                    <ComparisonTable
                        products={selectedProducts}
                        onRemove={removeFromCompare}
                        onReplace={handleOpenModal}
                        addToCart={addToCart}
                                onAddSlot={() => handleOpenModal()}
                    />
                )}
            </section>
        </main>
    );
}

