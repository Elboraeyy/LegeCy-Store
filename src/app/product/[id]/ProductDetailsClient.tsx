"use client";
// Mobile Optimized ProductDetailsClient

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import { fetchProductReviews, submitReview, ReviewDTO } from "@/lib/actions/reviews";
import { getStoreSettings } from "@/lib/actions/settings";
import ProductCard from "@/components/ProductCard";
import { CartIcon } from "@/components/icons/CartIcon";
import { Product } from "@/types/product";

// Types
interface ProductData {
  id: string;
  name: string;
  description: string | null;
  detailedDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  images: string[];
  category: string | null;
  categoryId: string | null;
  brand: { id: string; name: string; slug: string } | null;
  material: { id: string; name: string } | null;
  totalStock: number;
  sku: string | null;
  specs?: {
    movement?: string;
    case?: string;
    waterResistance?: string;
    glass?: string;
  };
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
    const params = new URLSearchParams({ limit: '8' });
    if (categoryId) params.set('categoryId', categoryId);
    params.set('excludeId', productId);
    const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();

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
  const [bottomOffset, setBottomOffset] = useState(0);

  // Format price
  const formatPrice = (p: number) => `EGP ${p.toLocaleString('en-EG')}`;

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

      if (productData?.categoryId) {
        const related = await getRelatedProducts(productData.categoryId, id);
        setRelatedProducts(related);
      }

      // Check settings
      const settings = await getStoreSettings(['FREE_SHIPPING_ENABLED', 'FREE_SHIPPING_THRESHOLD']);
      setShowFreeShipping(settings['FREE_SHIPPING_ENABLED'] === 'true');
      if (settings['FREE_SHIPPING_THRESHOLD']) {
        setShippingThreshold(settings['FREE_SHIPPING_THRESHOLD']);
      }

      setLoading(false);
    }
    loadData();
  }, [id]);

  // Sticky bar scroll handler & Footer collision
  useEffect(() => {
    const handleScroll = () => {
      // 1. Sticky Bar Visibility
      const addToCartBtn = document.getElementById('main-add-to-cart');
      if (addToCartBtn) {
        const rect = addToCartBtn.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }

      // 2. Footer Collision
      const footer = document.querySelector('.site-footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const overlap = window.innerHeight - footerRect.top;
        setBottomOffset(Math.max(0, overlap));
      } else {
        setBottomOffset(0);
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
  const isLowStock = product ? product.totalStock > 0 && product.totalStock <= 5 : false;

  // Average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  // Handlers
  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    setAddingToCart(true);
    for (let i = 0; i < quantity; i++) {
      addToCart(product.id);
    }
    await new Promise(r => setTimeout(r, 500));
    setAddingToCart(false);
  };

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= (product?.totalStock || 10)) {
      setQuantity(newQty);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${product?.name} at LegaCy Store!`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
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
        toast.success("Thank you for your review!", { description: "Your review has been submitted." });
        setShowReviewForm(false);
        setReviewForm({ name: "", rating: 5, text: "" });
        // Refresh reviews
        const newReviews = await fetchProductReviews(product.id);
        setReviews(newReviews);
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
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
          Product Not Found
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          The product you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <>
      <main className="container product-details-page">
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
          <Link href="/shop">Shop</Link>
          <svg className="breadcrumb-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Main Content */}
        <div className="detail-split">
          {/* Gallery Section */}
          <div className="detail-gallery">
            {/* Main Image */}
            <div
              className={`main-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setShowLightbox(true)}
            >
              <Image
                src={allImages[selectedImageIndex]}
                alt={product.name}
                fill
                className="main-product-image"
                style={{
                  objectFit: 'cover',
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                  transition: isZoomed ? 'none' : 'transform 0.3s ease'
                }}
                priority
              />

              {/* Sale Badge */}
              {isOnSale && (
                <span className="product-badge sale-badge">-{salePercent}%</span>
              )}

              {/* Stock Badge */}
              {isOutOfStock && (
                <span className="product-badge stock-badge out">Sold Out</span>
              )}
              {isLowStock && !isOutOfStock && (
                <span className="product-badge stock-badge low">Only {product.totalStock} left</span>
              )}

              {/* Zoom hint */}
              <div className="zoom-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  <path d="M11 8v6M8 11h6" />
                </svg>
                <span>Hover to zoom</span>
              </div>
            </div>

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
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
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
                {product.category}
              </Link>
            )}

            {/* Title */}
            <h1 className="detail-title-large">{product.name}</h1>

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
                  {avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="detail-price-block">
              <span className="detail-price-large">{formatPrice(product.price)}</span>
              {isOnSale && (
                <>
                  <span className="detail-price-original">{formatPrice(product.compareAtPrice!)}</span>
                  <span className="detail-price-save">Save {formatPrice(savedAmount)}</span>
                </>
              )}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="detail-desc">
                {product.description}
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
                  disabled={quantity >= (product.totalStock || 10)}
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
                  <span className="btn-loading">Adding...</span>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <CartIcon className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Actions - Row 2: Wishlist + Compare + Share */}
            <div className="actions-secondary">
              {/* Wishlist */}
              <button
                className={`btn-action-icon ${isClient && isFav(product.id) ? 'active' : ''}`}
                onClick={() => toggleFav(product.id)}
                title="Add to Wishlist"
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
                <span>Wishlist</span>
              </button>

              {/* Compare */}
              <button
                className="btn-action-icon"
                onClick={() => {
                  const productForCompare = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    img: product.imageUrl,
                    compareAtPrice: product.compareAtPrice,
                    inStock: product.totalStock > 0,
                    isNew: false,
                    category: product.category,
                    brand: product.brand?.name
                  };
                  window.location.href = `/compare?add=${product.id}`;
                }}
                title="Compare"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v18L2 15" />
                  <path d="M16 21V3l6 6" />
                </svg>
                <span>Compare</span>
              </button>

              {/* Share */}
              <div className="share-dropdown-wrapper">
                <button 
                  className="btn-action-icon"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  title="Share"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                  <span>Share</span>
                </button>

                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      className="share-dropdown"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <button onClick={() => handleShare('whatsapp')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                      </button>
                      <button onClick={() => handleShare('facebook')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </button>
                      <button onClick={() => handleShare('copy')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Copy Link
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="product-trust-badges">
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>14-Day Returns</span>
              </div>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Secure Payment</span>
              </div>
              <div className="trust-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>100% Authentic</span>
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
                    <span>Description</span>
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
                          {product.detailedDescription || product.description}
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
                  <span>Specifications</span>
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
                        {product.brand && (
                          <>
                            <span className="spec-label">Brand</span>
                            <span className="spec-value">{product.brand.name}</span>
                          </>
                        )}
                        {product.material && (
                          <>
                            <span className="spec-label">Material</span>
                            <span className="spec-value">{product.material.name}</span>
                          </>
                        )}
                        {product.category && (
                          <>
                            <span className="spec-label">Category</span>
                            <span className="spec-value">{product.category}</span>
                          </>
                        )}
                        {product.specs?.movement && (
                          <>
                            <span className="spec-label">Movement</span>
                            <span className="spec-value">{product.specs.movement}</span>
                          </>
                        )}
                        {product.specs?.case && (
                          <>
                            <span className="spec-label">Case</span>
                            <span className="spec-value">{product.specs.case}</span>
                          </>
                        )}
                        {product.specs?.waterResistance && (
                          <>
                            <span className="spec-label">Water Resistance</span>
                            <span className="spec-value">{product.specs.waterResistance}</span>
                          </>
                        )}
                        {product.specs?.glass && (
                          <>
                            <span className="spec-label">Glass</span>
                            <span className="spec-value">{product.specs.glass}</span>
                          </>
                        )}
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
                  <span>Shipping & Returns</span>
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
                      <ul className="shipping-info-list">
                        {showFreeShipping && <li>Free shipping on orders over EGP {Number(shippingThreshold).toLocaleString()}</li>}
                        <li>Delivery within 2-5 business days</li>
                        <li>Secure packaging for all orders</li>
                        <li>14-day return policy for unused items</li>
                        <li>Easy exchange process</li>
                      </ul>
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
            <h2>Customer Reviews</h2>
            <button
              className="btn btn-outline"
              onClick={() => setShowReviewForm(true)}
            >
              Write a Review
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
                  <span className="rating-count">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
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
              <p>No reviews yet. Be the first to review this product!</p>
              <button
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
              >
                Write a Review
              </button>
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-section">
            <h2 className="related-title">You May Also Like</h2>
            <div className="related-grid">
              {relatedProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
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
                style={{ objectFit: 'contain', maxHeight: '80vh', width: 'auto' }}
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
                  <Image src={img} alt="" width={60} height={60} style={{ objectFit: 'cover' }} />
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
                <h3>Write a Review</h3>
                <button className="modal-close" onClick={() => setShowReviewForm(false)}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    required
                    placeholder="Enter your name"
                  />
                </div>

                <div className="form-group">
                  <label>Rating</label>
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
                  <label>Your Review</label>
                  <textarea
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                    required
                    placeholder="Tell us about your experience with this product..."
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
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
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
            style={{ bottom: bottomOffset }}
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
                style={{ borderRadius: '8px', objectFit: 'cover' }}
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
                  disabled={quantity >= (product.totalStock || 10)}
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
                {addingToCart ? '...' : 'Add to Cart'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
