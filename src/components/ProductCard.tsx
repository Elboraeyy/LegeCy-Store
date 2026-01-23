"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import AddToCompareButton from "./AddToCompareButton";
import { CartIcon } from "@/components/icons/CartIcon";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();

  const formatPrice = (p: number) => `EGP ${p.toLocaleString('en-EG')}`;
  
  const productImage = product.imageUrl || product.img || '/placeholder.jpg';
  const [imgSrc, setImgSrc] = React.useState(productImage);

  // Badges logic
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.inStock === false;
  const isNew = product.isNew;

  const salePercent = isOnSale 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) 
    : 0;

  return (
    <div 
      className="group relative w-full min-w-0 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
      style={{ touchAction: 'manipulation' }}
    >
      {/* 1. Image Area - Aspect 3:4 */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImgSrc('/placeholder.jpg')}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isOnSale && (
            <span className="px-2 py-1 text-[10px] md:text-xs font-bold text-white bg-[#d4af37] rounded-sm tracking-wider uppercase">
              -{salePercent}%
            </span>
          )}
          {isNew && !isOnSale && !isOutOfStock && (
            <span className="px-2 py-1 text-[10px] md:text-xs font-bold text-white bg-[#12403C] rounded-sm tracking-wider uppercase">
              New
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-1 text-[10px] md:text-xs font-bold text-white bg-red-500 rounded-sm tracking-wider uppercase">
              Sold Out
            </span>
          )}
        </div>

        {/* Desktop: Hover Actions (Restored 3 buttons + Comparison) */}
        <div className="hidden md:flex absolute bottom-4 left-0 right-0 justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-4">

           
           {/* Add to Cart */}
           <button
             onClick={(e) => {
               e.preventDefault();
               addToCart(String(product.id));
             }}
             disabled={isOutOfStock}
             className="w-10 h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
             title="Add to Cart"
           >
            <CartIcon className="w-[18px] h-[18px]" />
           </button>

           {/* Favorite */}
           <button
             onClick={(e) => {
               e.preventDefault();
               toggleFav(String(product.id));
             }}
             className={`w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors shadow-lg hover:bg-[#12403C] hover:text-white ${isClient && isFav(String(product.id)) ? 'text-red-500' : 'text-gray-700'}`}
             title="Favorite"
           >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
           </button>

           {/* Compare */}
           <div className="w-10 h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer">
              <AddToCompareButton product={product} className="!p-0 !bg-transparent !border-0 hover:!bg-transparent hover:!text-white w-full h-full flex items-center justify-center" />
           </div>
        </div>

        {/* Mobile: Quick Actions (Always Visible) */}
        <div className="md:hidden absolute bottom-3 right-3 flex flex-col gap-2 z-20">
            <button
            onClick={(e) => {
                e.preventDefault();
                addToCart(String(product.id));
            }}
            disabled={isOutOfStock}
            className="w-9 h-9 rounded-full bg-white/95 text-[#12403C] shadow-md flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Add to cart"
            >
            {isOutOfStock ? (
                <span className="block w-1.5 h-1.5 rounded-full bg-red-500" />
            ) : (
                <CartIcon className="w-5 h-5" />
            )}
            </button>

          {/* Favorite */}
            <button
            onClick={(e) => {
                e.preventDefault();
                toggleFav(String(product.id));
            }}
            className={`w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center active:scale-90 transition-transform ${isClient && isFav(String(product.id)) ? 'text-red-500' : 'text-gray-600'}`}
            aria-label="Favorite"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
            </button>
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="p-2.5 sm:p-3 md:p-4 bg-white">
        <div className="mb-1">
           <Link href={`/product/${product.id}`}>
            <h3 className="text-xs sm:text-[13px] md:text-[15px] font-medium text-gray-900 leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-[#d4af37] transition-colors">
               {product.name}
             </h3>
           </Link>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-1.5 sm:mt-2">
          <span className="text-sm sm:text-[14px] md:text-[16px] font-bold text-[#12403C]">
            {formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="text-[10px] sm:text-[11px] md:text-[13px] text-gray-400 line-through decoration-gray-400">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
