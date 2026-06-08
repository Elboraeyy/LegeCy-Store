"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { motion } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import ProductCard from "@/components/ProductCard";
import { WishlistSkeleton } from "@/components/skeletons/wishlist-skeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { Reveal } from "@/components/ui/Reveal";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { Product } from "@/types/product";

interface WishlistClientProps {
  initialProducts?: Product[];
}

export default function WishlistClient({ initialProducts }: WishlistClientProps) {
  const router = useRouter();
  const { fav, products, toggleFav, isLoading: storeLoading } = useStore();
  const isClient = useIsClient();
  const { t } = useLanguage();

  const isSharedView = !!initialProducts;
  const displayProducts = isSharedView
    ? initialProducts
    : products.filter((p) => fav.includes(p.id));

  const copyToMyWishlist = () => {
    if (!initialProducts) return;
    initialProducts.forEach(p => {
      if (!fav.includes(p.id)) toggleFav(p.id);
    });
    toast.success("Added all items to your wishlist!");
    router.push('/wishlist');
  };

  if (!isClient || storeLoading) return <WishlistSkeleton />;

  return (

 
      <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <div className="flex flex-col items-center text-center gap-6">
              <div>
                <h1 className="fade-in">{isSharedView ? (t.wishlist.shared_title || "Shared Wishlist") : t.wishlist.title}</h1>
                <p className="fade-in mt-2 opacity-80">{isSharedView ? (t.wishlist.shared_subtitle || "Here are the items shared with you") : t.wishlist.subtitle}</p>
              </div>



              {isSharedView && (
                <button
                  onClick={copyToMyWishlist}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <span>{t.wishlist.copy_to_mine || "Copy to My List"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                </button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container mb-12 md:mb-20">
        {displayProducts.length === 0 ? (
          <Reveal width="100%">
            <div className="empty-state">
              <h3>{t.wishlist.empty_title}</h3>
              <p>
                {t.wishlist.empty_desc}
              </p>
            </div>
          </Reveal>
        ) : (
          <motion.div 
            className="grid product-grid-large" 
            id="fav-box"
            initial="hidden"
            animate="visible"
            variants={staggerContainerSlow}
          >
              {displayProducts.map((p) => (
              <motion.div key={p.id} className="h-full animate-fade-in" variants={fadeUpSlow}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
      </main>

  );
}
