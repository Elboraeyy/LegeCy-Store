"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

export default React.memo(function ProductCard({
  product,
  priority = false,
  hideNewBadge = false,
}: ProductCardProps) {
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();
  const { t, language } = useLanguage();
  const [showQuickView, setShowQuickView] = useState(false);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
      style: "currency",
      currency: "EGP",
    }).format(p);
  };

  const productImage = optimizeCloudinaryUrl(
    product.imageUrl || product.img || "/placeholder.jpg",
    600,
  );
  const [imgSrc, setImgSrc] = React.useState(productImage);

  // Update imgSrc when product changes
  React.useEffect(() => {
    setImgSrc(productImage);
  }, [productImage]);

  // Check sitewide offer
  const { sitewideConfig } = useStore();
  const isSitewideEnabled = sitewideConfig?.enabled === true;
  const sitewideTier1Percent =
    (sitewideConfig?.tier1DiscountPercent as number) || 20;

  // Badges logic
  const isIndividuallyOnSale =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const isOutOfStock = product.inStock === false;
  // ENABLE OVERSOLD/BACKORDERS (quantity limits only - sold out status unchanged)
  // const isOutOfStock = false;
  const isNew = product.isNew;

  // "Mihslsh khasm fo2 el khasm" - Don't apply sitewide if it's already on sale
  const applySitewideVisual = isSitewideEnabled && !isIndividuallyOnSale;

  const displayPrice = applySitewideVisual
    ? product.price - product.price * (sitewideTier1Percent / 100)
    : product.price;

  const displayComparePrice = applySitewideVisual
    ? product.price
    : product.compareAtPrice;

  const isOnSale = isIndividuallyOnSale || applySitewideVisual;

  const salePercent = isIndividuallyOnSale
    ? Math.round(
        ((product.compareAtPrice! - product.price) / product.compareAtPrice!) *
          100,
      )
    : applySitewideVisual
      ? sitewideTier1Percent
      : 0;

  const router = useRouter();

  const handleCardClick = () => {
    trackGAEvent("select_item", {
      item_list_id: "product_grid",
      item_list_name: "Product Grid",
      items: [
        {
          item_id: product.id,
          item_name: product.name,
          price: product.price,
          quantity: 1,
        },
      ],
    });
    // setShowQuickView(true); // Disable Quick View
    router.push(`/product/${product.id}`); // Navigate directly
  };

  return (
    <>
      <div
        className={`group relative w-full min-w-0 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${isOutOfStock ? "opacity-60 grayscale-[20%]" : ""}`}
        style={{ touchAction: "manipulation" }}
      >
        {/* 1. Image Area - Aspect 3:4 */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
          <div
            className="block w-full h-full cursor-pointer"
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCardClick();
            }}
          >
            <Image
              src={imgSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgSrc("/placeholder.jpg")}
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
                  <span className="px-2.5 py-1 text-[10px] md:text-[11px] font-extrabold text-[#12403C] bg-[#FCF8F3] rounded-full tracking-tight uppercase shadow-sm border border-[#12403C]/5">
                    -{salePercent}%
                  </span>
                )}
                {isNew && !isOnSale && !hideNewBadge && (
                  <span className="px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-[#12403C] rounded-full tracking-wider uppercase">
                    {t.product.new_arrival}
                  </span>
                )}
                {product.detailTags &&
                  product.detailTags.length > 0 &&
                  product.detailTags.map((tag, idx) => {
                    const parts = tag.split("|");
                    const label = parts[0];
                    const color = parts[1] || "#12403C";
                    return (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[10px] md:text-[11px] font-extrabold text-white rounded-full tracking-tight uppercase shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </span>
                    );
                  })}
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
              className={`w-10 h-10 rounded-full bg-white flex items-center justify-center transition-colors shadow-lg hover:bg-[#12403C] hover:text-white ${isClient && isFav(String(product.id)) ? "text-[#12403C]" : "text-gray-700"}`}
              title={t.product.favorite}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={
                  isClient && isFav(String(product.id))
                    ? "currentColor"
                    : "none"
                }
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>

            {/* Compare */}
            <div
              className="w-10 h-10 rounded-full bg-white text-gray-700 hover:bg-[#12403C] hover:text-white flex items-center justify-center transition-colors shadow-lg cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <AddToCompareButton
                product={product}
                className="!p-0 !bg-transparent !border-0 hover:!bg-transparent hover:!text-white w-full h-full flex items-center justify-center"
              />
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
              className={`w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center active:scale-90 transition-transform ${isClient && isFav(String(product.id)) ? "text-[#12403C]" : "text-gray-600"}`}
              aria-label={t.product.favorite}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={
                  isClient && isFav(String(product.id))
                    ? "currentColor"
                    : "none"
                }
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* 2. Content Area */}
        <div
          className="p-2.5 sm:p-3 md:p-4 bg-white text-center"
          onClick={handleCardClick}
        >
          {/* Rating Stars - Centered, under image and above name */}
          <div className="flex items-center justify-center gap-0.5 mb-1.5" aria-label={`Rating: ${(product.rating ?? 5).toFixed(1)} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={star <= Math.round(product.rating ?? 5) ? "var(--accent, #d4af37)" : "none"}
                stroke="var(--accent, #d4af37)"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            {product.reviewsCount !== undefined && product.reviewsCount > 0 && (
              <span className="text-[10px] text-gray-400 ms-1">
                ({product.reviewsCount})
              </span>
            )}
          </div>

          <div className="mb-1 flex items-center justify-center min-h-[2.5em]">
            <h3 className="text-xs sm:text-[13px] md:text-[15px] font-medium text-gray-900 leading-tight line-clamp-2 group-hover:text-[#d4af37] transition-colors cursor-pointer">
              {product.name}
            </h3>
          </div>

          <div className="flex flex-col items-center justify-center gap-0.5 mt-1 sm:mt-1.5 w-full overflow-hidden">
            {isOnSale && displayComparePrice ? (
              <span className="text-[clamp(10px,3vw,12px)] md:text-[14px] text-gray-400 line-through decoration-gray-400/50 whitespace-nowrap underline-offset-[3px] truncate min-w-0">
                {formatPrice(displayComparePrice)}
              </span>
            ) : (
              <span className="text-[clamp(10px,3vw,12px)] md:text-[14px] text-transparent select-none whitespace-nowrap truncate min-w-0">
                &nbsp;
              </span>
            )}
            <span className="text-[clamp(13px,4.5vw,16px)] md:text-[18px] font-bold text-[#12403C] whitespace-nowrap flex-shrink-0 tracking-tight">
              {formatPrice(displayPrice)}
            </span>
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
