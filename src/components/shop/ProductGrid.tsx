"use client";

import React from "react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
// import ModernProductCard from "@/components/ModernProductCard";
import { Product } from "@/types/product";

interface ProductGridProps {
    products: Product[];
    viewMode: "grid" | "list" | "compact";
    isLoading?: boolean;
}

export default function ProductGrid({
    products,
    viewMode,
    isLoading = false,
}: ProductGridProps) {
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
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
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
                    No Products Found
                </h3>
                <p className="text-gray-600 max-w-md">
                    We couldn&apos;t find any products matching your filters. Try adjusting your search criteria.
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
    const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
    const productImage = product.imageUrl || product.img || '/placeholder.jpg';
    const [imgSrc, setImgSrc] = React.useState(productImage);

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
                        alt={product.name}
                        fill
                        className="object-cover"
                        onError={() => setImgSrc('/placeholder.jpg')}
                    />
                    {isOnSale && (
                        <span className="absolute top-2 left-2 px-2 py-1 text-xs font-bold text-white bg-[#d4af37] rounded">
                            -{salePercent}%
                        </span>
                    )}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="px-3 py-1 text-sm font-bold text-white bg-[#d4af37] rounded">
                                Sold Out
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-[#d4af37] transition-colors cursor-pointer">
                            {product.name}
                        </h3>
                        {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                {product.description}
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
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
