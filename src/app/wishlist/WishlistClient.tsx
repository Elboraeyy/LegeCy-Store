"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import ModernProductCard from "@/components/ModernProductCard";
import { WishlistSkeleton } from "@/components/skeletons/wishlist-skeleton";
import { useIsClient } from "@/hooks/useIsClient";
import { Reveal } from "@/components/ui/Reveal";
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
  const { fav, products, addToCart, toggleFav, isLoading: storeLoading } = useStore();
  const isClient = useIsClient();
  const { t } = useLanguage();
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const shareMenuRef = React.useRef<HTMLDivElement>(null);

  // Close share menu on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showShareMenu]);

  const isSharedView = !!initialProducts;
  const displayProducts = isSharedView
    ? initialProducts
    : products.filter((p) => fav.includes(p.id));

  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  const handleShare = async (platform: string = 'copy') => {
    if (fav.length === 0) {
      toast.error(t.wishlist.empty_desc || "Wishlist is empty");
      return;
    }

    let shareUrl = "";

    // Check if we already have a share ID or need to create one
    const toastId = toast.loading(t.common.loading || "Creating share link...");
    try {
      const res = await createSharedWishlist(fav);
      if (res.success && res.id) {
        shareUrl = `${window.location.origin}/wishlist/share/${res.id}`;
      } else {
        toast.error("Failed to share wishlist", { id: toastId });
        return;
      }
    } catch {
      toast.error("Something went wrong", { id: toastId });
      return;
    }

    // const title = t.wishlist.title || "My Wishlist";
    const text = t.wishlist.share_text?.replace('{count}', fav.length.toString()) || `Check out my wishlist with ${fav.length} items!`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + shareUrl)}`, '_blank');
        toast.dismiss(toastId);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        toast.dismiss(toastId);
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t.product.share_options.copied || "Link copied to clipboard!", { id: toastId });
        break;
    }
    setShowShareMenu(false);
  };

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

              {!isSharedView && displayProducts.length > 0 && (
                <div className="share-dropdown-wrapper mx-auto relative z-[10]" ref={shareMenuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                    className="px-6 h-12 rounded-full bg-[#FCF8F3] border border-[#12403C]/10 flex items-center gap-3 text-[#12403C] hover:bg-[#12403C] hover:text-white transition-all shadow-sm group"
                    title={t.product.share}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    <span className="font-medium">{t.common.share || "Share"}</span>
                  </button>

                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        className="share-dropdown"
                        initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                        exit={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                        style={{ 
                          left: '50%', 
                          top: 'calc(100% + 12px)',
                          position: 'absolute',
                          zIndex: 100000
                        }}
                      >
                        <div className="share-menu-inner">
                          <button className="share-item" onClick={() => handleShare('whatsapp')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" stroke="none">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {t.product.share_options.whatsapp}
                          </button>
                          <button className="share-item" onClick={() => handleShare('facebook')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" stroke="none">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            {t.product.share_options.facebook}
                          </button>
                          <button className="share-item" onClick={() => handleShare('copy')}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            {t.product.share_options.copy_link}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

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
