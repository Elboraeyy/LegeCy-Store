"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import ModernProductCard from "@/components/ModernProductCard";

import { useIsClient } from "@/hooks/useIsClient";
import { useLanguage } from "@/context/LanguageContext";


import { createSharedWishlist } from "@/lib/actions/wishlist";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  img?: string;
  imageUrl?: string | null;
  category?: string;
  brand?: string;
}

interface WishlistClientProps {
  initialProducts?: Product[];
}

export default function WishlistClient({ initialProducts }: WishlistClientProps) {
  const router = useRouter();
  const { fav, products, addToCart, toggleFav } = useStore();
  const isClient = useIsClient();
  const { t } = useLanguage();

  const isSharedView = !!initialProducts;
  const displayProducts = isSharedView
    ? initialProducts
    : products.filter((p) => fav.includes(p.id));

  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  const handleShare = async () => {
    if (fav.length === 0) {
      toast.error(t.wishlist.empty_desc || "Wishlist is empty");
      return;
    }

    const toastId = toast.loading("Creating share link...");
    try {
      const res = await createSharedWishlist(fav);
      if (res.success && res.id) {
        const url = `${window.location.origin}/wishlist/share/${res.id}`;
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!", { id: toastId });
      } else {
        toast.error("Failed to share wishlist", { id: toastId });
      }
    } catch {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const copyToMyWishlist = () => {
    if (!initialProducts) return;
    initialProducts.forEach(p => {
      if (!fav.includes(p.id)) toggleFav(p.id);
    });
    toast.success("Added all items to your wishlist!");
    router.push('/wishlist');
  };

  if (!isClient) return null;

  return (

 
      <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="fade-in">{isSharedView ? (t.wishlist.shared_title || "Shared Wishlist") : t.wishlist.title}</h1>
                <p className="fade-in mt-2 opacity-80">{isSharedView ? (t.wishlist.shared_subtitle || "Here are the items shared with you") : t.wishlist.subtitle}</p>
              </div>

              {!isSharedView && displayProducts.length > 0 && (
                <button
                  onClick={handleShare}
                  className="btn-primary flex items-center gap-2 group"
                >
                  <span>{t.common.share || "Share"}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              )}

              {isSharedView && (
                <button
                  onClick={copyToMyWishlist}
                  className="btn-primary flex items-center gap-2"
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

      <section className="container" style={{ marginBottom: "80px" }}>
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
              <motion.div key={p.id} className="product-card premium" variants={fadeUpSlow}>
                {/* Mobile View */}
                <div className="md:hidden">
                  <ModernProductCard product={p} />
                </div>

                {/* Desktop View - Original */}
                <div className="hidden md:block h-full"> 
                  <div className="product-media" style={{ cursor: "pointer" }}>
                    <Link href={`/product/${p.id}`}>
                      <Image
                        src={p.imageUrl || p.img || '/placeholder.jpg'}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </Link>
                  </div>
                  <div className="product-body">
                    <h3
                      className="product-title"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/product/${p.id}`)}
                    >
                      {p.name}
                    </h3>
                    <p className="product-price">{formatPrice(p.price)}</p>
                    <div className="product-actions">
                      <Link
                        href={`/product/${p.id}`}
                        className="btn-icon"
                        title={t.wishlist.view_details}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </Link>
                      <button
                        className="btn-icon"
                        title={t.common.addToCart}
                        onClick={() => addToCart(String(p.id))}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                      </button>

                        {!isSharedView && (
                          <button
                            className="btn-icon"
                            title={t.wishlist.remove}
                            onClick={() => toggleFav(String(p.id))}
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
      </main>

  );
}
