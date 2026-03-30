"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import { CartIcon } from "@/components/icons/CartIcon";
import { useLanguage } from "@/context/LanguageContext";

import AddToCompareButton from "./AddToCompareButton";
import ProductQuickView from "./ProductQuickView";

interface ModernProductCardProps {
    product: Product;
    priority?: boolean;
    compact?: boolean;
    hideNewBadge?: boolean;
}

export default function ModernProductCard({ product, priority = false, compact = false, hideNewBadge = false }: ModernProductCardProps) {
    const { addToCart, toggleFav, isFav, sitewideConfig } = useStore();
    const isClient = useIsClient();
    const { t, language } = useLanguage();
    const [showQuickView, setShowQuickView] = useState(false);

    // Price formatting
    const formatPrice = (p: number) => {
        return language === 'ar'
            ? `${p.toLocaleString('en-US')} ${t.common.currency}`
            : `${t.common.currency} ${p.toLocaleString('en-US')}`;
    };

    // Image fallback logic
    const productImage = product.imageUrl || product.img || '/placeholder.jpg';
    const [imgSrc, setImgSrc] = React.useState(productImage);

    // Check sitewide offer
    const isSitewideEnabled = sitewideConfig?.enabled === true;
    const sitewideTier1Percent = (sitewideConfig?.tier1DiscountPercent as number) || 20;

    // Status badges
    const isIndividuallyOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const isOutOfStock = product.inStock === false;
    const isNew = product.isNew;

    // "Mihslsh khasm fo2 el khasm"
    const applySitewideVisual = isSitewideEnabled && !isIndividuallyOnSale;

    const displayPrice = applySitewideVisual
        ? product.price - (product.price * (sitewideTier1Percent / 100))
        : product.price;

    const displayComparePrice = applySitewideVisual
        ? product.price
        : product.compareAtPrice;

    const isOnSale = isIndividuallyOnSale || applySitewideVisual;

    const salePercent = isIndividuallyOnSale
        ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) 
        : applySitewideVisual ? sitewideTier1Percent : 0;

    const handleCardClick = () => {
        setShowQuickView(true);
    };

    return (
        <>
            <div className={`group modern-card relative w-full bg-white rounded-lg overflow-hidden border border-gray-100/50 shadow-sm cursor-pointer ${isOutOfStock ? 'opacity-60 grayscale-[20%]' : ''}`}>
                {/* 1. Image Container */}
                <div className="relative aspect-[4/5] w-full bg-gray-50 overflow-hidden">
                    <div className="block w-full h-full cursor-pointer" onClick={handleCardClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}>
                        <Image
                            src={imgSrc}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            priority={priority}
                            sizes="(max-width: 640px) 160px, (max-width: 1024px) 33vw, 25vw"
                            onError={() => setImgSrc('/placeholder.jpg')}
                        />
                    </div>

                    {/* Badges (Top Left) */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1 z-10">
                        {isOnSale && (
                            <span className="px-2.5 py-1 text-[10px] font-extrabold text-[#12403C] bg-[#FCF8F3] rounded-full uppercase shadow-sm tracking-tight border border-[#12403C]/5">
                                -{salePercent}%
                            </span>
                        )}
                        {isNew && !isOnSale && !isOutOfStock && !hideNewBadge && (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-[#12403C] rounded-full uppercase shadow-sm">
                                {t.product.new}
                            </span>
                        )}
                        {isOutOfStock && (
                            <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full uppercase shadow-sm">
                                {t.product.sold_out}
                            </span>
                        )}
                    </div>

                    {/* Actions Container */}
                    {!compact && (
                        <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-20 md:bottom-4 md:left-0 md:right-0 md:flex-row md:justify-center md:gap-3 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 px-4">

                            {/* Add to Cart */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart(String(product.id));
                                }}
                                disabled={isOutOfStock}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                title={t.common.addToCart}
                            >
                                <CartIcon className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" />
                            </button>

                            {/* Favorite */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFav(String(product.id));
                                }}
                                className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center transition-colors shadow-lg hover:bg-[#12403C] hover:text-white ${isClient && isFav(String(product.id)) ? 'text-[#12403C]' : 'text-gray-700'}`}
                                title={t.common.favorite}
                            >
                                <svg className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" viewBox="0 0 24 24" fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </button>

                            {/* Compare */}
                            <div
                                className="hidden md:flex w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white items-center justify-center transition-colors shadow-lg cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <AddToCompareButton product={product} className="!p-0 !bg-transparent !border-0 hover:!bg-transparent hover:!text-white w-full h-full flex items-center justify-center" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Info Area */}
                <div className="p-2 md:p-3" onClick={handleCardClick}>
                    <h3 className="text-[11px] md:text-[13px] font-medium text-[#12403C] leading-snug line-clamp-2 min-h-[2.5em] mb-1 cursor-pointer">
                        {product.name}
                    </h3>
                    <div className="flex flex-row items-baseline gap-1.5 md:gap-2 flex-nowrap overflow-hidden w-full mt-0.5">
                        <span className="text-[clamp(13px,4.5vw,16px)] md:text-[17px] font-bold text-[#12403C] whitespace-nowrap flex-shrink-0 tracking-tight">
                            {formatPrice(displayPrice)}
                        </span>
                        {isOnSale && displayComparePrice && (
                            <span className="text-[clamp(10px,3vw,12px)] md:text-[13px] text-gray-400 line-through decoration-gray-400/50 whitespace-nowrap underline-offset-[3px] truncate min-w-0">
                                {formatPrice(displayComparePrice)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <ProductQuickView
                product={product}
                isOpen={showQuickView}
                onClose={() => setShowQuickView(false)}
            />
        </>
    );
}

