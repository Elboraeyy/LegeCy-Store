"use client";
// Mobile Optimized ProductDetailsClient

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useAnimation, PanInfo } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { useComparison } from "@/context/ComparisonContext";
import { useLanguage } from "@/context/LanguageContext";
import { useIsClient } from "@/hooks/useIsClient";
import { fetchProductReviews, submitReview, ReviewDTO } from "@/lib/actions/reviews";
import { getStoreSettings } from "@/lib/actions/settings";
// import ProductCard from "@/components/ProductCard";
// import ModernProductCard from "@/components/ModernProductCard";
import ModernProductCarousel from "@/components/ModernProductCarousel";

import { CartIcon } from "@/components/icons/CartIcon";
import { CompareIcon } from "@/components/icons/CompareIcon";
import { Product, getLocalized } from "@/types/product";
import { Truck, RefreshCw, Package } from "lucide-react";
import { trackMetaEvent } from "@/components/MetaPixel";

// Types
interface ProductData {
  id: string;
  name: string;
  nameAr?: string | null;
  description: string | null;
  descriptionAr?: string | null;
  detailedDescription: string | null;
  detailedDescriptionAr?: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  images: string[];
  category: string | null;
  categoryAr?: string | null;
  categoryId: string | null;
  categorySlug?: string;
  brand: { id: string; name: string; nameAr?: string; slug: string } | null;
  material: { id: string; name: string; nameAr?: string } | null;
  totalStock: number;
  sku: string | null;
  createdAt?: string;
  specs?: {
    dialSize?: string;
    dialColor?: string;
    caseColor?: string;
    strapColor?: string;
    strapMaterial?: string;
    strapWidth?: string;
    movement?: string;
    glass?: string;
    waterResistance?: string;
    case?: string;
    hourMarkers?: string;
  };
  detailTags?: string[];
  similarProducts?: Product[];
}

interface ProductDetailsClientProps {
  id: string;
}

// Fetch product data
async function getProductData(id: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`/api/products/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Fetch related products
async function getRelatedProducts(categoryId: string | null, productId: string): Promise<Product[]> {
  try {
      // Fetch more products to have a good pool for randomization
      const params = new URLSearchParams({ limit: '20' });
      if (categoryId) params.set('categoryId', categoryId);
      params.set('excludeId', productId);
      const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      const allRelated = data.products || [];

      // Randomize and take 8
      return allRelated
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);
    } catch {
      return [];
    }
  }

// Mobile Image Carousel with smooth finger swipe
interface MobileImageCarouselProps {
  allImages: string[];
  productName: string;
  selectedImageIndex: number;
  setSelectedImageIndex: (idx: number | ((prev: number) => number)) => void;
  onImageClick: () => void;
  isOnSale: boolean;
  salePercent: number;
  isOutOfStock: boolean;
  isNew: boolean;
  soldOutLabel: string;
  newLabel: string;
  language: string;
}

// Liquid spring configuration moved outside to be stable
const liquidSpring = {
  type: "spring",
  stiffness: 180, // Slightly reduced for smoother flow
  damping: 25,    // Balanced to avoid too much oscillation
  mass: 0.6,      // Lower mass for sportier, faster feel
  restDelta: 0.001
} as const;

function MobileImageCarousel({
  allImages,
  productName,
  selectedImageIndex,
  setSelectedImageIndex,
  onImageClick,
  isOnSale,
  salePercent,
  isOutOfStock,
  isNew,
  soldOutLabel,
  newLabel,
  language,
}: MobileImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragX = useMotionValue(0);
  const controls = useAnimation();
  const [containerWidth, setContainerWidth] = useState(0);
  const isRTL = language === 'ar';

  // Measure container width
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);



  // Animate to the selected image
  useEffect(() => {
    if (containerWidth > 0) {
      const targetX = isRTL
        ? selectedImageIndex * containerWidth
        : -selectedImageIndex * containerWidth;

      controls.start({
        x: targetX,
        transition: liquidSpring,
      });
    }
  }, [selectedImageIndex, containerWidth, controls, isRTL]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      const swipeThreshold = containerWidth * 0.15; // 15% of width instead of fixed 50px
      const velocityThreshold = 200; // Lower threshold to catch more flicks

      // Decide whether to go next, previous, or stay
      let shouldGoNext = false;
      let shouldGoPrev = false;

      if (isRTL) {
        // RTL: Next is Right (positive offset), Prev is Left (negative offset)
        shouldGoNext = (offset > swipeThreshold || velocity > velocityThreshold);
        shouldGoPrev = (offset < -swipeThreshold || velocity < -velocityThreshold);
      } else {
        // LTR: Next is Left (negative offset), Prev is Right (positive offset)
        shouldGoNext = (offset < -swipeThreshold || velocity < -velocityThreshold);
        shouldGoPrev = (offset > swipeThreshold || velocity > velocityThreshold);
      }

      if (shouldGoNext && selectedImageIndex < allImages.length - 1) {
        setSelectedImageIndex((s: number) => s + 1);
      } else if (shouldGoPrev && selectedImageIndex > 0) {
        setSelectedImageIndex((s: number) => s - 1);
      } else {
        // Snap back to current image
        const targetX = isRTL
          ? selectedImageIndex * containerWidth
          : -selectedImageIndex * containerWidth;

        controls.start({
          x: targetX,
          transition: liquidSpring,
        });
      }
    },
    [selectedImageIndex, allImages.length, containerWidth, controls, setSelectedImageIndex, isRTL]
  );

  return (
    <div
      ref={containerRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="block md:hidden relative w-full aspect-[4/5] rounded-[24px] overflow-hidden bg-[#f8f8f6]"
      style={{ touchAction: "pan-y" }}
    >
      <motion.div
        className="flex h-full"
        style={{
          width: `${allImages.length * 100}%`,
          x: dragX,
          cursor: "grab",
        }}
        drag="x"
        dragConstraints={{
          left: isRTL ? 0 : -(allImages.length - 1) * containerWidth,
          right: isRTL ? (allImages.length - 1) * containerWidth : 0,
        }}
        dragElastic={0.08} // Tighter tracking for "liquid" feel
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
      >
        {allImages.map((img, idx) => (
          <div
            key={idx}
            className="relative h-full flex-shrink-0"
            style={{ width: `${100 / allImages.length}%` }}
          >
            <Image
              src={img}
              alt={`${productName} ${idx + 1}`}
              fill
              sizes="100vw"
              quality={85}
              className="object-cover"
              draggable={false}
              priority={idx === 0}
              loading="eager"
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
              onClick={onImageClick}
            />
          </div>
        ))}
      </motion.div>

      {/* Badges Mobile */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        {isOnSale && (
          <span className="product-badge sale-badge !relative !top-auto !left-auto rounded-full">
            -{salePercent}%
          </span>
        )}
        {isNew && !isOnSale && !isOutOfStock && (
          <span className="product-badge !relative !top-auto !left-auto rounded-full" style={{ backgroundColor: '#12403C', color: 'white' }}>
            {newLabel}
          </span>
        )}
        {isOutOfStock && (
          <span className="product-badge stock-badge out !relative !top-auto !left-auto !bottom-auto bg-red-600 rounded-full">
            {soldOutLabel}
          </span>
        )}
      </div>

      {/* Dot Indicators */}
      {allImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/10 backdrop-blur-md p-2 rounded-full pointer-events-none">
          {allImages.map((_, idx) => (
            <motion.div
              key={idx}
              animate={{
                width: selectedImageIndex === idx ? 20 : 6,
                backgroundColor: selectedImageIndex === idx ? "#fff" : "rgba(255,255,255,0.4)"
              }}
              className="h-1.5 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const router = useRouter();
  const { addToCart, toggleFav, isFav } = useStore();
  const { addToCompare, isInComparison } = useComparison();
  const isClient = useIsClient();
  const { t, language } = useLanguage();

  // State
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>("description");
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 5, text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showFreeShipping, setShowFreeShipping] = useState(false);
  const [shippingThreshold, setShippingThreshold] = useState("1000");
  const [notifyChannel, setNotifyChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [notifyContact, setNotifyContact] = useState('');
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyDone, setNotifyDone] = useState(false);
  const shareMenuRef = React.useRef<HTMLDivElement>(null);

  // Close share menu on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    }

    if (showShareMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showShareMenu]);

  // Format price
  const formatPrice = (p: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(p);
  };

  // Ensure page starts at top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Carousel scroll sync is now handled by Framer Motion animate prop

  // Load data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [productData, reviewsData] = await Promise.all([
        getProductData(id),
        fetchProductReviews(id)
      ]);

      setProduct(productData);
      setReviews(reviewsData);

      // Always fetch internal related products as fallback
      const related = await getRelatedProducts(productData?.categoryId || null, id);
      setRelatedProducts(related);

      // Check settings
      const settings = await getStoreSettings(['FREE_SHIPPING_ENABLED', 'FREE_SHIPPING_THRESHOLD']);
      setShowFreeShipping(settings['FREE_SHIPPING_ENABLED'] === 'true');
      if (settings['FREE_SHIPPING_THRESHOLD']) {
        setShippingThreshold(settings['FREE_SHIPPING_THRESHOLD']);
      }

      // Meta Pixel: Track ViewContent event
      if (productData) {
        trackMetaEvent('ViewContent', {
          content_ids: [productData.id],
          content_name: productData.name,
          content_type: 'product',
          value: productData.price,
          currency: 'EGP',
          content_category: productData.category || undefined,
        });
      }

      setLoading(false);
    }
    loadData();
  }, [id]);

  // Sticky bar scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const addToCartBtn = document.getElementById('main-add-to-cart');
      if (addToCartBtn) {
        const rect = addToCartBtn.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // All images
  const allImages = product ? [
    product.imageUrl || '/placeholder.jpg',
    ...(product.images || [])
  ].filter(Boolean) : ['/placeholder.jpg'];

  // Calculations
  const isOnSale = product?.compareAtPrice && product.compareAtPrice > product.price;
  const salePercent = isOnSale
    ? Math.round(((product!.compareAtPrice! - product!.price) / product!.compareAtPrice!) * 100)
    : 0;
  const savedAmount = isOnSale ? product!.compareAtPrice! - product!.price : 0;
  const isOutOfStock = product ? product.totalStock <= 0 : false;
  const isNew = product?.createdAt
    ? (new Date().getTime() - new Date(product.createdAt).getTime()) < (5 * 24 * 60 * 60 * 1000)
    : false;


  // Average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Handlers
  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    setAddingToCart(true);
    // Use the updated addToCart that supports quantity
    addToCart(product.id, undefined, true, quantity);
    await new Promise(r => setTimeout(r, 500));
    setAddingToCart(false);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    const maxStock = product?.totalStock || 0;
    if (newQty >= 1 && newQty <= maxStock) {
      setQuantity(newQty);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const title = getLocalized(product, language, 'name') || 'Product';
    const text = t.product.share_text.replace('{name}', getLocalized(product, language, 'name') || '');

    if (platform === 'native' && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
      return;
    }

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success(t.product.share_options.copied);
        break;
    }
    setShowShareMenu(false);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setSubmittingReview(true);
    try {
      const result = await submitReview({
        productId: product.id,
        name: reviewForm.name,
        rating: reviewForm.rating,
        text: reviewForm.text
      });

      if (result.success) {
        toast.success(t.product.review_submitted);
        setShowReviewForm(false);
        setReviewForm({ name: "", rating: 5, text: "" });
        // Refresh reviews
        const newReviews = await fetchProductReviews(product.id);
        setReviews(newReviews);
      } else {
        toast.error(result.error || t.messages.error_occurred);
      }
    } catch {
      toast.error(t.messages.error_occurred);
    }
    setSubmittingReview(false);
  };

  // Loading state
  if (loading) {
    return (
      <main className="container" style={{ padding: '80px 24px' }}>
        <div className="detail-split">
          <div className="detail-gallery">
            <div className="skeleton" style={{ width: '100%', aspectRatio: '4/5', borderRadius: '4px' }} />
          </div>
          <div className="detail-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton" style={{ height: '48px', width: '80%' }} />
            <div className="skeleton" style={{ height: '24px', width: '40%' }} />
            <div className="skeleton" style={{ height: '36px', width: '30%' }} />
            <div className="skeleton" style={{ height: '100px', width: '100%' }} />
          </div>
        </div>
      </main>
    );
  }

  // Not found state
  if (!product) {
    return (
      <main className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', marginBottom: '16px' }}>
          {t.product.product_not_found}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          {t.product.product_not_found_desc}
        </p>
        <Link href="/shop" className="btn btn-primary">
          {t.cart.continue_shopping}
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="product-details-page">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="breadcrumb-home">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
          <svg className="breadcrumb-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <Link href="/shop">{t.nav.shop}</Link>
          <svg className="breadcrumb-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="breadcrumb-current">{getLocalized(product, language, 'name')}</span>
        </nav>

        {/* Main Content */}
        <div className="detail-split">
          {/* Gallery Section */}
          <div className="detail-gallery">
            {/* Main Image */}
            {/* Main Image - Desktop (Zoomable) */}
            <div className="hidden md:block relative">
              <div
                className={`main-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setShowLightbox(true)}
              >
                <Image
                  src={allImages[selectedImageIndex]}
                  alt={getLocalized(product, language, 'name')}
                  fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    quality={85}
                  className="main-product-image"
                  style={{
                    objectFit: 'cover',
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                    transition: isZoomed ? 'none' : 'transform 0.3s ease'
                  }}
                  priority
                    loading="eager"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                />

                {/* Badges Desktop */}
                {isOnSale && (
                  <span className="product-badge sale-badge">-{salePercent}%</span>
                )}
                  {isNew && !isOnSale && !isOutOfStock && (
                    <span className="product-badge" style={{ backgroundColor: '#12403C', color: 'white' }}>{t.product.new_arrival}</span>
                  )}
                {isOutOfStock && (
                  <span className="product-badge stock-badge out">{t.product.sold_out}</span>
                )}

                <div className="zoom-hint">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                  <span>{t.product.hover_zoom}</span>
                </div>
              </div>
            </div>

              {/* Main Image - Mobile (Liquid Framer Motion Carousel) */}
              <MobileImageCarousel
                allImages={allImages}
                productName={getLocalized(product, language, 'name')}
                selectedImageIndex={selectedImageIndex}
                setSelectedImageIndex={setSelectedImageIndex}
                onImageClick={() => setShowLightbox(true)}
                isOnSale={!!isOnSale}
                salePercent={salePercent}
                isOutOfStock={isOutOfStock}
                isNew={isNew}
                soldOutLabel={t.product.sold_out}
                newLabel={t.product.new_arrival}
                language={language}
              />

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="gallery-thumbnails">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumbnail-btn ${selectedImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <Image
                      src={img}
                      alt={`${getLocalized(product, language, 'name')} ${idx + 1}`}
                      fill
                      sizes="80px"
                      quality={60}
                      style={{ objectFit: 'cover' }}
                      loading="eager"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="detail-content">
            {/* Category */}
            {product.category && (
              <Link href={`/shop?category=${product.categoryId}`} className="detail-brand">
                {getLocalized(product, language, 'category')}
              </Link>
            )}

            {/* Detail Tags */}
            {product.detailTags && product.detailTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {product.detailTags.map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="detail-title-large">{getLocalized(product, language, 'name')}</h1>

            {/* Rating */}
            {reviews.length > 0 && (
              <div className="detail-rating">
                <div className="stars-display">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={star <= Math.round(avgRating) ? 'var(--accent)' : 'none'}
                      stroke="var(--accent)"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <span className="rating-text">
                  {avgRating.toFixed(1)} ({reviews.length} {t.product.reviews})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="detail-price-block">
              <span className="detail-price-large">{formatPrice(product.price)}</span>
              {isOnSale && (
                <>
                  <span className="detail-price-original">{formatPrice(product.compareAtPrice!)}</span>
                  <span className="detail-price-save">{t.product.sale} {formatPrice(savedAmount)}</span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="detail-desc">
                {getLocalized(product, language, 'description')}
              </p>
            )}


            {/* Actions - Row 1: Quantity + Add to Cart */}
            <div className="actions-large" id="main-add-to-cart">
              {/* Quantity Selector */}
              <div className="qty-selector">
                <button 
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="qty-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="qty-value">{quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= (product?.totalStock || 0)}
                  className="qty-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              {/* Add to Cart */}
              <button
                className="btn btn-primary flex-1"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
              >
                {addingToCart ? (
                  <span className="btn-loading">{t.common.loading}</span>
                ) : isOutOfStock ? (
                    t.product.sold_out
                ) : (
                  <>
                    <CartIcon className="w-5 h-5" />
                        {t.product.add_to_cart}
                  </>
                )}
              </button>
            </div>

            {/* Notify Me When Available - Out of Stock */}
            {isOutOfStock && (
              <div className="notify-me-section">
                {notifyDone ? (
                  <div className="notify-success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>{notifyChannel === 'whatsapp' ? t.product.notify_me.success_whatsapp : t.product.notify_me.success_email}</p>
                  </div>
                ) : (
                  <>
                    <div className="notify-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      <div>
                        <h4>{t.product.notify_me.title}</h4>
                        <p>{t.product.notify_me.desc}</p>
                      </div>
                    </div>

                    <div className="notify-channel-toggle">
                      <button
                        className={`notify-channel-btn ${notifyChannel === 'whatsapp' ? 'active' : ''}`}
                        onClick={() => { setNotifyChannel('whatsapp'); setNotifyContact(''); }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t.product.notify_me.whatsapp}
                      </button>
                      <button
                        className={`notify-channel-btn ${notifyChannel === 'email' ? 'active' : ''}`}
                        onClick={() => { setNotifyChannel('email'); setNotifyContact(''); }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        {t.product.notify_me.email}
                      </button>
                    </div>

                    <form
                      className="notify-form"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (notifyChannel === 'whatsapp') {
                          const cleaned = notifyContact.replace(/\s/g, '');
                          if (!/^01[0125]\d{8}$/.test(cleaned)) {
                            toast.error(t.product.notify_me.invalid_whatsapp);
                            return;
                          }
                        } else {
                          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyContact)) {
                            toast.error(t.product.notify_me.invalid_email);
                            return;
                          }
                        }

                        setNotifyLoading(true);
                        try {
                          const res = await fetch('/api/notify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              productId: product.id,
                              channel: notifyChannel,
                              ...(notifyChannel === 'whatsapp'
                                ? { whatsapp: notifyContact.replace(/\s/g, '') }
                                : { email: notifyContact }),
                            }),
                          });

                          const data = await res.json();
                          if (data.message === 'already_subscribed') {
                            toast.info(t.product.notify_me.already_subscribed);
                          }
                          setNotifyDone(true);
                        } catch {
                          toast.error(t.product.notify_me.error);
                        } finally {
                          setNotifyLoading(false);
                        }
                      }}
                    >
                      <input
                        type={notifyChannel === 'email' ? 'email' : 'tel'}
                        required
                        value={notifyContact}
                        onChange={(e) => setNotifyContact(e.target.value)}
                        placeholder={notifyChannel === 'whatsapp' ? t.product.notify_me.whatsapp_placeholder : t.product.notify_me.email_placeholder}
                        className="notify-input"
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        disabled={notifyLoading || !notifyContact}
                        className="btn btn-primary notify-submit"
                      >
                        {notifyLoading ? t.product.notify_me.submitting : t.product.notify_me.submit}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* Actions - Row 2: Wishlist + Compare + Share */}
            <div className="actions-secondary">
              {/* Wishlist */}
              <button
                className={`btn-action-icon ${isClient && isFav(product.id) ? 'active' : ''}`}
                onClick={() => toggleFav(product.id)}
                title={t.product.favorite}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={isClient && isFav(product.id) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{t.common.favorite}</span>
              </button>

              {/* Compare */}
              <button
                className={`btn-action-icon ${isInComparison(product.id) ? 'active' : ''}`}
                onClick={() => {
                  const productForCompare = {
                    id: product.id,
                    name: getLocalized(product, language, 'name'),
                    price: product.price,
                    imageUrl: product.imageUrl,
                    img: product.imageUrl,
                    compareAtPrice: product.compareAtPrice,
                    inStock: product.totalStock > 0,
                    isNew: false,
                    category: getLocalized(product, language, 'category'),
                    brand: getLocalized(product.brand, language, 'name'),
                    specs: product.specs,
                    totalStock: product.totalStock,
                  };
                  if (!isInComparison(product.id)) {
                    addToCompare(productForCompare as unknown as Product);
                  }
                  router.push(`/compare?fromLabel=${getLocalized(product, language, 'name')}`);
                }}
                title={t.product.compare}
              >
                <CompareIcon width={20} height={20} className="w-5 h-5" />
                <span>{t.product.compare}</span>
              </button>

              {/* Share */}
              <div className="share-dropdown-wrapper" ref={shareMenuRef}>
                <button 
                  className="btn-action-icon"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  title={t.product.share}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>{t.product.share}</span>
                </button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      className="share-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
            </div>

            {/* Trust Badges */}
            <div className="product-trust-badges" style={{ color: 'var(--accent)' }}>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>{t.product.trust.returns}</span>
              </div>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{t.product.trust.secure}</span>
              </div>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{t.product.trust.authentic}</span>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="product-accordions">
              {/* Description */}
              {(product.description || product.detailedDescription) && (
                <div className={`accordion-item ${activeAccordion === 'description' ? 'open' : ''}`}>
                  <button
                    className="accordion-header"
                    onClick={() => setActiveAccordion(activeAccordion === 'description' ? null : 'description')}
                  >
                    <span>{t.product.description}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d={activeAccordion === 'description' ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {activeAccordion === 'description' && (
                      <motion.div
                        className="accordion-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                          {getLocalized(product, language, 'detailedDescription') || getLocalized(product, language, 'description')}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Specifications */}
              <div className={`accordion-item ${activeAccordion === 'specs' ? 'open' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => setActiveAccordion(activeAccordion === 'specs' ? null : 'specs')}
                >
                  <span>{t.product.specs}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={activeAccordion === 'specs' ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                  </svg>
                </button>
                <AnimatePresence>
                  {activeAccordion === 'specs' && (
                    <motion.div
                      className="accordion-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="specs-grid">
                        {/* Basic Info */}
                        {product.brand && (
                          <>
                            <span className="spec-label">{t.product.brand}</span>
                            <span className="spec-value">{getLocalized(product.brand, language, 'name')}</span>
                          </>
                        )}
                        {product.category && (
                          <>
                            <span className="spec-label">{t.product.category}</span>
                            <span className="spec-value">{getLocalized(product, language, 'category')}</span>
                          </>
                        )}

                        {/* Technical Specs */}
                        {product.specs?.dialSize && (
                          <>
                            <span className="spec-label">{t.product.dial_size}</span>
                            <span className="spec-value">{product.specs.dialSize}</span>
                          </>
                        )}
                        {product.specs?.dialColor && (
                          <>
                            <span className="spec-label">{t.product.dial_color}</span>
                            <span className="spec-value">{product.specs.dialColor}</span>
                          </>
                        )}
                        {product.specs?.case && (
                          <>
                            <span className="spec-label">{t.product.case}</span>
                            <span className="spec-value">{product.specs.case}</span>
                          </>
                        )}
                        {product.specs?.caseColor && (
                          <>
                            <span className="spec-label">{t.product.case_color}</span>
                            <span className="spec-value">{product.specs.caseColor}</span>
                          </>
                        )}
                        {product.specs?.strapMaterial && (
                          <>
                            <span className="spec-label">{t.product.strap_material}</span>
                            <span className="spec-value">{product.specs.strapMaterial}</span>
                          </>
                        )}
                        {product.specs?.strapColor && (
                          <>
                            <span className="spec-label">{t.product.strap_color}</span>
                            <span className="spec-value">{product.specs.strapColor}</span>
                          </>
                        )}
                        {product.specs?.strapWidth && (
                          <>
                            <span className="spec-label">{t.product.strap_width}</span>
                            <span className="spec-value">{product.specs.strapWidth}</span>
                          </>
                        )}
                        {product.specs?.movement && (
                          <>
                            <span className="spec-label">{t.product.movement}</span>
                            <span className="spec-value">{product.specs.movement}</span>
                          </>
                        )}
                        {product.specs?.glass && (
                          <>
                            <span className="spec-label">{t.product.glass}</span>
                            <span className="spec-value">{product.specs.glass}</span>
                          </>
                        )}
                        {product.specs?.waterResistance && (
                          <>
                            <span className="spec-label">{t.product.water_resistance}</span>
                            <span className="spec-value">{product.specs.waterResistance}</span>
                          </>
                        )}
                        {product.specs?.hourMarkers && (
                          <>
                            <span className="spec-label">{t.product.hour_markers}</span>
                            <span className="spec-value">{product.specs.hourMarkers}</span>
                          </>
                        )}
                        <span className="spec-label">Status</span>
                        <span className="spec-value">{product.totalStock > 0 ? 'Available' : 'Unavailable'}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shipping */}
              <div className={`accordion-item ${activeAccordion === 'shipping' ? 'open' : ''}`}>
                <button
                  className="accordion-header"
                  onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')}
                >
                  <span>{t.product.shipping_returns}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={activeAccordion === 'shipping' ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                  </svg>
                </button>
                <AnimatePresence>
                  {activeAccordion === 'shipping' && (
                    <motion.div
                      className="accordion-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <ul className="space-y-3 mt-2 list-none p-0">
                          {/* Free Shipping */}
                          {showFreeShipping && (
                            <li className="flex items-start gap-3">
                                <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                              <div>
                                <span className="font-semibold block text-foreground">{t.product.shipping_list.free_shipping.replace('{amount}', formatPrice(Number(shippingThreshold)))}</span>
                              </div>
                            </li>
                          )}

                          {/* Delivery */}
                          <li className="flex items-start gap-3">
                              <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                            <span>{t.product.shipping_list.delivery}</span>
                          </li>

                          {/* Packaging */}
                          <li className="flex items-start gap-3">
                              <Package className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                            <span>{t.product.shipping_list.packaging}</span>
                          </li>

                          {/* Returns */}
                          <li className="flex items-start gap-3">
                              <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                            <span>{t.product.shipping_list.returns}</span>
                          </li>

                          {/* Exchange */}
                          <li className="flex items-start gap-3">
                              <RefreshCw className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                            <span>{t.product.shipping_list.exchange}</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>




        {/* Reviews Section */}
        <section className="product-reviews-section">
          <div className="reviews-header">
            <h2>{t.product.reviews_title}</h2>
            <button
              className="btn btn-outline"
              onClick={() => setShowReviewForm(true)}
            >
              {t.product.write_review}
            </button>
          </div>

          {reviews.length > 0 ? (
            <>
              {/* Rating Summary */}
              <div className="reviews-summary">
                <div className="rating-big">
                  <span className="rating-number">{avgRating.toFixed(1)}</span>
                  <div className="rating-stars-big">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill={star <= Math.round(avgRating) ? 'var(--accent)' : 'none'}
                        stroke="var(--accent)"
                        strokeWidth="2"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="rating-count">{t.product.based_on.replace('{count}', reviews.length.toString())}</span>
                </div>

                {/* Rating Bars Removed as per request */}
              </div>

              {/* Reviews List */}
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="review-author">
                        <div className="author-avatar">
                          {review.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="author-name">{review.name}</span>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill={star <= review.rating ? 'var(--accent)' : 'none'}
                            stroke="var(--accent)"
                            strokeWidth="2"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="review-text">{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-reviews">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
                <p>{t.product.no_reviews}</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
              >
                  {t.product.write_review}
              </button>
            </div>
          )}
        </section>

          {/* Similar Products (Manual or Fallback) */}
          {(() => {
            const rawProducts = product.similarProducts && product.similarProducts.length > 0
              ? product.similarProducts
              : relatedProducts;
            // Filter out the current product from recommendations
            const filteredProducts = rawProducts.filter(p => p.id !== product.id);
            if (filteredProducts.length === 0) return null;
            return (
              <section className="related-section mt-16 px-0 md:px-4">
                <ModernProductCarousel
                  products={filteredProducts}
                  title={product.similarProducts && product.similarProducts.length > 0
                    ? (t.product.similar_products || (language === 'ar' ? 'منتجات مشابهة' : 'Similar Products'))
                    : (t.product.related_products || (language === 'ar' ? 'مقترحات لنا' : 'Recommended For You'))}
                  subtitle={language === 'ar' ? 'قد يعجبك أيضاً' : 'You might also like'}
                  viewAllLink={`/shop?category=${product.categorySlug || product.categoryId || ''}`}
                />
              </section>
            );
          })()}
        </div>
      </main>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            className="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLightbox(false)}
          >
            <button className="lightbox-close" onClick={() => setShowLightbox(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="lightbox-arrow left"
                onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <Image
                src={allImages[selectedImageIndex]}
                alt={product.name}
                width={800}
                height={800}
                quality={90}
                style={{ objectFit: 'contain', maxHeight: '80vh', width: 'auto' }}
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg'; }}
              />
              <button
                className="lightbox-arrow right"
                onClick={() => setSelectedImageIndex(Math.min(allImages.length - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === allImages.length - 1}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            <div className="lightbox-thumbnails">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`lightbox-thumb ${selectedImageIndex === idx ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                >
                  <Image src={img} alt="" width={60} height={60} quality={50} style={{ objectFit: 'cover' }} loading="eager" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              className="review-form-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{t.product.write_review}</h3>
                <button className="modal-close" onClick={() => setShowReviewForm(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>{t.product.your_name}</label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    required
                    placeholder={t.product.name_placeholder}
                  />
                </div>

                <div className="form-group">
                  <label>{t.product.your_rating}</label>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= reviewForm.rating ? 'active' : ''}`}
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill={star <= reviewForm.rating ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.product.your_review}</label>
                  <textarea
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                    required
                    placeholder={t.product.review_placeholder}
                    rows={4}
                    minLength={10}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReview}
                  style={{ width: '100%' }}
                >
                  {submittingReview ? t.auth.sending : t.product.submit_review}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Add to Cart */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            className="sticky-add-to-cart"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="sticky-product-info">
              <Image
                src={allImages[0]}
                alt={product.name}
                width={48}
                height={48}
                quality={60}
                style={{ borderRadius: '8px', objectFit: 'cover' }}
                loading="eager"
              />
              <div>
                <span className="sticky-product-name">{product.name.length > 25 ? product.name.slice(0, 25) + '...' : product.name}</span>
                <span className="sticky-product-price">{formatPrice(product.price)}</span>
              </div>
            </div>
            <div className="sticky-actions">
              <div className="qty-selector">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="qty-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= (product?.totalStock || 0)}
                  className="qty-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
              <button
                className="sticky-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
              >
                {addingToCart ? t.common.loading : t.product.add_to_cart}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
