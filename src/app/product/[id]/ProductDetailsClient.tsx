"use client";
import React, { useState, useEffect } from "react";
import { useStore } from "@/context/StoreContext";
import { useComparison } from "@/context/ComparisonContext";
import Link from "next/link";
import NextImage from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import RatingStars from "@/components/social-proof/RatingStars";
import TrustBadges from "@/components/social-proof/TrustBadges";
import ReviewCard from "@/components/social-proof/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import NotifyMeForm from "@/components/NotifyMeForm";
import RelatedProducts from "@/components/RelatedProducts";
import { fetchProductById, fetchRelatedProducts, ShopProduct } from "@/lib/actions/shop";
import { fetchProductReviews, ReviewDTO } from "@/lib/actions/reviews";
import { toast } from "sonner";

interface ProductDetailsClientProps {
  id: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  category: string | null;
  imageUrl: string | null;
  images: string[];
  variants: { id: string; sku: string; price: number; stock: number }[];
  inStock: boolean;
  totalStock: number;
}

export default function ProductDetailsClient({ id }: ProductDetailsClientProps) {
  const { addToCart, toggleFav, isFav } = useStore();
  const { addToCompare, removeFromCompare, isInComparison } = useComparison();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Gallery State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const searchParams = useSearchParams();

  // Load product and reviews from database
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        const productData = await fetchProductById(id);
        
        if (!productData) {
          if (mounted) setLoading(false);
          return;
        }

        const [reviewsData, relatedData] = await Promise.all([
          fetchProductReviews(id),
          fetchRelatedProducts(id, productData.category)
        ]);
        
        if (mounted) {
          setProduct(productData);
          setReviews(reviewsData);
          setRelatedProducts(relatedData);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [id]);



  // Track previous ID to reset gallery state when it changes
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setSelectedImage(null);
    setIsZoomed(false);
  }

  const activeImage = selectedImage || product?.imageUrl || "";
  const galleryImages = product?.images && product.images.length > 0 
    ? product.images 
    : product?.imageUrl ? [product.imageUrl] : [];

  // Zoom Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) {
        setIsZoomed(false);
    } else {
        setIsZoomed(true);
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    }
  };

  if (loading) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading product details...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Product not found</h2>
        <Link href="/shop" className="btn btn-outline">Back to Shop</Link>
      </main>
    );
  }

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;
  
  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  // Determine back link
  const from = searchParams.get('from');
  const backLink = from === 'cart' ? '/cart' : '/shop';
  const backLabel = from === 'cart' ? 'Cart' : 'Shop';

  return (
    <main className="product-detail container">
       <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link href={backLink}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', border: '1px solid var(--border-light)', borderRadius: '50%', color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"></path>
            <path d="M12 19l-7-7 7-7"></path>
          </svg>
        </Link>
        <Link href={backLink}>{backLabel}</Link> / <span id="bread-name">{product.name}</span>
      </div>

      <div className="detail-split">
        <div className="detail-gallery">
          <Reveal width="100%">
            <div className="gallery-container" style={{ width: '100%' }}>
                <div 
                  className={`main-image-wrapper ${isZoomed ? 'zoomed' : ''}`}
                  onMouseMove={handleMouseMove}
                  onClick={handleImageClick}
                  onMouseLeave={() => setIsZoomed(false)}
                >
                  {activeImage ? (
                    <NextImage 
                      id="d-img" 
                      src={activeImage} 
                      className="product-img" 
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      priority
                      style={{ 
                        transform: isZoomed ? `scale(2) translate(${50 - zoomPos.x}%, ${50 - zoomPos.y}%)` : 'scale(1)',
                        transformOrigin: 'center center',
                        transition: isZoomed ? 'none' : 'transform 0.3s ease'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#f8f8f8',
                      color: '#999'
                    }}>
                      No Image
                    </div>
                  )}
                </div>
                
                {galleryImages.length > 1 && (
                    <div className="gallery-thumbnails">
                        {galleryImages.map((img, idx) => (
                            <button 
                              key={idx} 
                              className={`thumbnail-btn ${activeImage === img ? 'active' : ''}`}
                              onClick={() => setSelectedImage(img)}
                            >
                              <NextImage 
                                  src={img} 
                                  alt={`${product.name} thumb ${idx}`} 
                                  fill 
                                  className="object-cover" 
                                  sizes="100px"
                              />
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </Reveal>
        </div>

        <div className="detail-content">
          <Reveal delay={0.1}>
            <h1 id="d-name" className="detail-title-large">
              {product.name}
            </h1>
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
              <RatingStars rating={Number(avgRating)} showText />
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="detail-subtitle">{product.category || 'Premium Collection'}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="price-wrapper">
              <span id="d-price" className="detail-price-large">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span style={{ 
                  textDecoration: 'line-through', 
                  color: 'var(--text-muted)', 
                  marginLeft: '12px',
                  fontSize: '18px'
                }}>
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="detail-desc">
              <p>
                {product.description || 
                  "Designed for the modern connoisseur, this timepiece blends heritage craftsmanship with contemporary aesthetics. Featuring a precision movement and premium materials, it is built to stand the test of time."}
              </p>
            </div>
          </Reveal>

          {/* Quantity Selector replaced Stock Status */}
          <Reveal delay={0.35}>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="quantity-selector" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--border-light)',
                borderRadius: '25px',
                padding: '4px 12px',
                background: '#fff'
              }}>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    color: quantity <= 1 ? '#ccc' : '#12403C',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  −
                </button>
                <span style={{
                  minWidth: '24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a3c34'
                }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(product.totalStock, q + 1))}
                  disabled={quantity >= product.totalStock}
                  style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'transparent',
                    cursor: quantity >= product.totalStock ? 'not-allowed' : 'pointer',
                    color: quantity >= product.totalStock ? '#ccc' : '#1a3c34',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  +
                </button>
              </div>

              {!product.inStock && (
                <span style={{ 
                  color: '#b91c1c', 
                  background: 'rgba(185, 28, 28, 0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  Out of Stock
                </span>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="actions-large">


              <button
                id="add-cart-btn"
                className="btn btn-primary"
                onClick={() => {
                  const defaultVariant = product.variants[0];
                  if (defaultVariant) {
                    // Add multiple times based on quantity
                    for (let i = 0; i < quantity; i++) {
                      addToCart(product.id, defaultVariant.id);
                    }
                    toast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart`);
                    setQuantity(1); // Reset quantity after adding
                  }
                }}
                disabled={!product.inStock || product.variants.length === 0}
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>

              <button
                id="add-compare-btn"
                className={`btn-compare-icon ${isInComparison(product.id) ? 'active' : ''}`}
                title={isInComparison(product.id) ? "Remove from Compare" : "Add to Compare"}
                onClick={() => {
                  if (isInComparison(product.id)) {
                    removeFromCompare(product.id);
                    toast.success("Removed from comparison");
                  } else {
                    addToCompare({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      img: product.imageUrl || undefined,
                      cat: product.category || undefined,
                      description: product.description || undefined,
                    });
                    router.push("/compare?fromLabel=Product");
                  }
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 20V10M18 6V4M12 20V12M12 8V4M6 20V14M6 10V4"/>
                  <circle cx="18" cy="8" r="2"/>
                  <circle cx="12" cy="10" r="2"/>
                  <circle cx="6" cy="12" r="2"/>
                </svg>
              </button>

              <button
                id="add-wishlist-btn"
                className={`btn-wishlist-icon ${isFav(product.id) ? 'active' : ''}`}
                title={isFav(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                onClick={() => toggleFav(product.id)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isFav(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            
            {/* Notify Me Form if Out of Stock */}
            {!product.inStock && (
                <NotifyMeForm productId={product.id} />
            )}
            <TrustBadges />
          </Reveal>

          {/* Variants */}
          {product.variants.length > 1 && (
            <Reveal delay={0.5} width="100%">
              <div className="specs-table-container">
                <h3 className="specs-title">Available Variants</h3>
                <div className="specs-grid">
                  {product.variants.map(v => (
                    <React.Fragment key={v.id}>
                      <span className="spec-label">{v.sku}</span>
                      <span className="spec-value">
                        EGP {v.price.toLocaleString()} - {v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section className="reviews-section" style={{ padding: '80px 0', borderTop: '1px solid var(--border-light)', marginTop: '80px' }}>
        <Reveal>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', margin: 0 }}>Customer Reviews</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <span style={{ fontSize: '18px', fontWeight: 600 }}>{avgRating}/5</span>
               <RatingStars rating={Number(avgRating)} size={20} />
               <span style={{ color: 'var(--text-muted)' }}>Based on {reviews.length} reviews</span>
            </div>
          </div>
        </Reveal>

        {reviews.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            {reviews.map((review, idx) => (
               <Reveal key={review.id} delay={idx * 0.1}>
                  <ReviewCard 
                    // id={Number(review.id)} // Removed as per component definition
                    name={review.name}
                    rating={review.rating}
                    text={review.text}
                    date={new Date(review.createdAt).toLocaleDateString()}
                    // spread other properties
                  />
               </Reveal>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '12px' }}>
            <p>No reviews yet for this product.</p>
          </div>
        )}

        <Reveal>
          <ReviewForm productId={id} onSuccess={() => window.location.reload()} />
        </Reveal>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
         <RelatedProducts products={relatedProducts} currentProductId={id} />
      )}
    </main>
  );
}
