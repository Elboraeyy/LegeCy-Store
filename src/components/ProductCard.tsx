"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import AddToCompareButton from "./AddToCompareButton";
import { CartIcon } from "@/components/icons/CartIcon";
import { useLanguage } from "@/context/LanguageContext";
import { optimizeCloudinaryUrl } from "@/lib/utils/image";
import { trackGAEvent } from "@/components/GoogleAnalytics";
import ProductQuickView from "./ProductQuickView";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  hideNewBadge?: boolean;
}

export default React.memo(function ProductCard({ product, priority = false, hideNewBadge = false }: ProductCardProps) {
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();
  const { t, language } = useLanguage();
  const [showQuickView, setShowQuickView] = useState(false);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(p);
  };
  
  const productImage = optimizeCloudinaryUrl(product.imageUrl || product.img || '/placeholder.jpg', 600);
  const [imgSrc, setImgSrc] = React.useState(productImage);

  // Update imgSrc when product changes
  React.useEffect(() => {
    setImgSrc(productImage);
  }, [productImage]);

  // Badges logic
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.inStock === false;
  const isNew = product.isNew;

  const salePercent = isOnSale 
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100) 
    : 0;

  const handleCardClick = () => {
    trackGAEvent('select_item', {
      item_list_id: "product_grid",
      item_list_name: "Product Grid",
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1
      }]
    });
    setShowQuickView(true);
  };

  return (
    <>
      <div
        className={`group relative w-full min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${isOutOfStock ? 'opacity-60 grayscale-[20%]' : ''}`}
        style={{ touchAction: 'manipulation' }}
      >
        {/* 1. Image Area - Aspect 3:4 */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
          <div
            className="block w-full h-full cursor-pointer"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(); }}
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgSrc('/placeholder.jpg')}
            />
          </div>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
            {isOutOfStock ? (
              <span className="px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-red-600 rounded-full tracking-wider uppercase">
                {t.product.sold_out}
              </span>
            ) : (
              <>
                {isOnSale && (
                  <span className="px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-[#d4af37] rounded-full tracking-wider uppercase">
                    -{salePercent}%
                  </span>
                )}
                {isNew && !isOnSale && !hideNewBadge && (
                  <span className="px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-[#12403C] rounded-full tracking-wider uppercase">
                    {t.product.new_arrival}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Desktop: Hover Actions (Restored 3 buttons + Comparison) */}
          <div className="hidden md:flex absolute bottom-4 left-0 right-0 justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 px-4">


            {/* Add to Cart */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(String(product.id));
              }}
              disabled={isOutOfStock}
              className="w-10 h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={t.product.add_to_cart}
            >
              <CartIcon className="w-[18px] h-[18px]" />
            </button>

            {/* Favorite */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFav(String(product.id));
              }}
              className={`w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors shadow-lg hover:bg-[#12403C] hover:text-white ${isClient && isFav(String(product.id)) ? 'text-[#12403C]' : 'text-gray-700'}`}
              title={t.product.favorite}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            {/* Compare */}
            <div
              className="w-10 h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <AddToCompareButton product={product} className="!p-0 !bg-transparent !border-0 hover:!bg-transparent hover:!text-white w-full h-full flex items-center justify-center" />
            </div>
          </div>

          {/* Mobile: Quick Actions (Always Visible) */}
          <div className="md:hidden absolute bottom-3 right-3 flex flex-col gap-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(String(product.id));
              }}
              disabled={isOutOfStock}
              className="w-9 h-9 rounded-full bg-white/95 text-[#12403C] shadow-md flex items-center justify-center active:scale-90 transition-transform"
              aria-label={t.product.add_to_cart}
            >
              {isOutOfStock ? (
                <span className="block w-1.5 h-1.5 rounded-full bg-slate-400" />
              ) : (
                <CartIcon className="w-5 h-5" />
              )}
            </button>

            {/* Favorite */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFav(String(product.id));
              }}
              className={`w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center active:scale-90 transition-transform ${isClient && isFav(String(product.id)) ? 'text-[#12403C]' : 'text-gray-600'}`}
              aria-label={t.product.favorite}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isClient && isFav(String(product.id)) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* 2. Content Area */}
        <div className="p-2.5 sm:p-3 md:p-4 bg-white" onClick={handleCardClick}>
          <div className="mb-1">
            <h3 className="text-xs sm:text-[13px] md:text-[15px] font-medium text-gray-900 leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-[#d4af37] transition-colors cursor-pointer">
              {product.name}
            </h3>
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

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
      />
    </>
  );
});
