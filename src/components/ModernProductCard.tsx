"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";

interface ModernProductCardProps {
    product: Product;
    priority?: boolean;
}

export default function ModernProductCard({ product, priority = false }: ModernProductCardProps) {
    const { addToCart, isFav, toggleFav } = useStore();
    const isClient = useIsClient();

    // Price formatting
    const formatPrice = (p: number) => `EGP ${p.toLocaleString('en-EG')}`;

    // Image fallback logic
    const productImage = product.imageUrl || product.img || '/placeholder.jpg';
    const [imgSrc, setImgSrc] = React.useState(productImage);

    // Status badges
    const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const isOutOfStock = product.inStock === false;
    const isNew = product.isNew;
    const salePercent = isOnSale
        ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
        : 0;

    return (
        <div className="modern-card relative w-full bg-white rounded-xl overflow-hidden border border-gray-100/50 shadow-sm">
            {/* 1. Image Container */}
            <div className="relative aspect-[3/4] w-full bg-gray-50 overflow-hidden">
                <Link href={`/product/${product.id}`} className="block w-full h-full">
                    <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                        priority={priority}
                        sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 25vw"
                        onError={() => setImgSrc('/placeholder.jpg')}
                    />
                </Link>

                {/* Badges (Top Left) */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {isOnSale && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#d4af37] rounded-full uppercase shadow-sm">
                            -{salePercent}%
                        </span>
                    )}
                    {isNew && !isOnSale && !isOutOfStock && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#12403C] rounded-full uppercase shadow-sm">
                            New
                        </span>
                    )}
                    {isOutOfStock && (
                        <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full uppercase shadow-sm">
                            Sold Out
                        </span>
                    )}
                </div>

                {/* Actions Container (Bottom Right - Stacked) */}
                <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-20">
                    {/* Favorite Button (Top) */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFav(String(product.id));
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm active:scale-95 transition-transform"
                        aria-label="Add to Favorites"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={isClient && isFav(String(product.id)) ? "#12403C" : "none"}
                            stroke={isClient && isFav(String(product.id)) ? "#12403C" : "#12403C"}
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>

                    {/* Quick Add (Bottom) - Cart Icon */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(String(product.id));
                        }}
                        disabled={isOutOfStock}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[#12403C] text-white shadow-md active:scale-90 transition-transform disabled:bg-gray-300 disabled:cursor-not-allowed"
                        aria-label="Add to Cart"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 20a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* 2. Info Area */}
            <div className="p-3">
                <Link href={`/product/${product.id}`} className="block">
                    <h3 className="text-[13px] font-medium text-[#12403C] leading-snug line-clamp-2 min-h-[2.5em] mb-1">
                        {product.name}
                    </h3>
                </Link>
                <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-bold text-[#12403C]">
                        {formatPrice(product.price)}
                    </span>
                    {isOnSale && (
                        <span className="text-[11px] text-gray-400 line-through">
                            {formatPrice(product.compareAtPrice!)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
