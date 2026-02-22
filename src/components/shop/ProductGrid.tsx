"use client";

import React from "react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
// import ModernProductCard from "@/components/ModernProductCard";
import { Product, getLocalized } from "@/types/product";
import { useLanguage } from "@/context/LanguageContext";
import { optimizeCloudinaryUrl } from "@/lib/utils/image";

interface ProductGridProps {
    products: Product[];
    viewMode: "grid" | "list" | "compact" | "categories";
    isLoading?: boolean;
    categories?: { id: string; name: string; nameAr?: string | null; slug: string }[];
}

export default function ProductGrid({
    products,
    viewMode,
    isLoading = false,
    categories = [],
}: ProductGridProps) {
    const { t, language } = useLanguage();

    if (isLoading) {
        return (
            <>
                <style jsx>{`
                    .product-grid {
                        display: grid;
                        gap: 0.5rem;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                    @media (min-width: 768px) {
                        .product-grid {
                            gap: 1rem;
                            grid-template-columns: repeat(3, minmax(0, 1fr));
                        }
                    }
                    @media (min-width: 1024px) {
                        .product-grid {
                            gap: 1.5rem;
                            grid-template-columns: repeat(4, minmax(0, 1fr));
                        }
                    }
                `}</style>
                <div className="product-grid">
                    {[...Array(8)].map((_, i) => (
                        <ProductSkeleton key={i} />
                    ))}
                </div>
            </>
        );
    }

    if (products.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            >
                <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center" aria-hidden="true">
                    <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-heading">
                    {t.product.no_products_found}
                </h3>
                <p className="text-gray-600 max-w-md">
                    {t.product.no_products_desc}
                </p>
            </div>
        );
    }

    if (viewMode === "list") {
        return (
            <div className="space-y-4 sm:space-y-6">
                {products.map((product) => (
                    <ProductListCard key={product.id} product={product} />
                ))}
            </div>
        );
    }

    if (viewMode === "categories") {
        // Group products by category
        const productsByCategory = new Map<string, { category: { id: string; name: string; nameAr?: string | null; slug: string }; products: Product[] }>();

        // Initialize all categories
        categories.forEach(cat => {
            productsByCategory.set(cat.slug, { category: cat, products: [] });
        });

        // Add "Uncategorized" for products without category
        const uncategorizedName = language === "ar" ? "غير مصنف" : "Uncategorized";
        productsByCategory.set("uncategorized", {
            category: {
                id: "",
                name: uncategorizedName,
                nameAr: language === "ar" ? uncategorizedName : null,
                slug: "uncategorized"
            },
            products: []
        });

        // Group products
        products.forEach(product => {
            const categorySlug = product.categorySlug || "uncategorized";
            const categoryData = productsByCategory.get(categorySlug);
            if (categoryData) {
                categoryData.products.push(product);
            } else {
                // If category not found, add to uncategorized
                const uncategorized = productsByCategory.get("uncategorized");
                if (uncategorized) {
                    uncategorized.products.push(product);
                }
            }
        });

        // Filter out empty categories
        const categoriesWithProducts = Array.from(productsByCategory.values()).filter(
            item => item.products.length > 0
        );

        if (categoriesWithProducts.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center" aria-hidden="true">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 font-heading">
                        {t.product.no_products_found}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                        {t.product.no_products_desc}
                    </p>
                </div>
            );
        }

        return (
            <>
                <style jsx global>{`
                    .category-scroll {
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                        -webkit-overflow-scrolling: touch !important;
                        scroll-behavior: smooth;
                    }
                    .category-scroll::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                        background: transparent !important;
                    }
                `}</style>
                <div className="space-y-10">
                    {categoriesWithProducts.map(({ category, products: categoryProducts }) => {
                        
                        return (
                            <div key={category.slug} className="space-y-5">
                                {/* Category Header */}
                                <div className="flex items-center justify-between border-b border-gray-200 pb-3 px-4 md:px-0">
                                    <h2 className="text-2xl font-semibold text-[#12403C] font-heading">
                                        {getLocalized(category, language, 'name')}
                                    </h2>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {categoryProducts.length} {categoryProducts.length === 1 ? (language === "ar" ? "منتج" : "product") : (language === "ar" ? "منتجات" : "products")}
                                    </span>
                                </div>

                                {/* Horizontal Scrollable Products */}
                                <div className="relative w-full -mx-0">
                                    <div
                                        className="category-scroll overflow-x-auto overflow-y-hidden w-full md:px-0"
                                        style={{
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none',
                                            WebkitOverflowScrolling: 'touch',
                                            scrollSnapType: 'x mandatory',
                                            paddingLeft: '3px',
                                            paddingRight: '3px',
                                        }}
                                    >
                                        <div className="flex gap-3 md:gap-6 pb-4">
                                            {categoryProducts.map((product) => (
                                                    <div key={product.id} className="w-[45%] md:w-[240px] flex-none" style={{ scrollSnapAlign: 'start' }}>
                                                    <ProductCard product={product} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    }

    return (
        <>
            <style jsx>{`
                .product-grid {
                    display: grid;
                    gap: 0.5rem;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                @media (min-width: 768px) {
                    .product-grid {
                        gap: 1rem;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                }
                @media (min-width: 1024px) {
                    .product-grid {
                        gap: 1.5rem;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                    }
                }
            `}</style>
            <div className="product-grid">
                {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
            </div>
        </>
    );
}

function ProductSkeleton() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-[3/4] bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
        </div>
    );
}

function ProductListCard({ product }: { product: Product }) {
    const { t, language } = useLanguage();
    const formatPrice = (p: number) => `${t.common.currency} ${p.toLocaleString()}`;
    const productImage = optimizeCloudinaryUrl(product.imageUrl || product.img || '/placeholder.jpg', 600);
    const [imgSrc, setImgSrc] = React.useState(productImage);

    // Update imgSrc when product changes
    React.useEffect(() => {
        setImgSrc(productImage);
    }, [productImage]);

    const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const isOutOfStock = product.inStock === false;
    const salePercent = isOnSale
        ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
        : 0;

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
                {/* Image */}
                <div className="relative w-full sm:w-48 aspect-[3/4] sm:aspect-square flex-shrink-0 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                        src={imgSrc}
                        alt={getLocalized(product, language, 'name')}
                        fill
                        className="object-cover"
                        onError={() => setImgSrc('/placeholder.jpg')}
                    />
                    {isOnSale && (
                        <span className="absolute top-2 left-2 px-3 py-1.5 text-xs font-bold text-white bg-[#d4af37] rounded-full">
                            -{salePercent}%
                        </span>
                    )}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="px-3 py-1.5 text-sm font-bold text-white bg-red-600 rounded-full">
                                {t.product.sold_out}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-[#d4af37] transition-colors cursor-pointer">
                            {getLocalized(product, language, 'name')}
                        </h3>
                        {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {getLocalized(product, language, 'description')}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-[#12403C]">
                                {formatPrice(product.price)}
                            </span>
                            {isOnSale && (
                                <span className="text-sm text-gray-400 line-through">
                                    {formatPrice(product.compareAtPrice!)}
                                </span>
                            )}
                        </div>

                        <a
                            href={`/product/${product.id}`}
                            className="px-6 py-2 bg-[#12403C] text-white rounded-lg text-sm font-medium hover:bg-[#d4af37] transition-colors"
                        >
                            {t.product.view_details}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
