/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Share2, Truck, RotateCcw, ShieldCheck, ChevronDown, ChevronUp, Star, Package, RefreshCw } from 'lucide-react';

interface ProductPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        name: string;
        description: string;
        detailedDescription: string;
        originalPrice: string;
        salePrice: string;
        imageUrl: string;
        gallery: string[];
        specs: Record<string, string>;
        categoryName?: string;
        brandName?: string;
    };
}

export default function ProductPreviewModal({ isOpen, onClose, data }: ProductPreviewModalProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [activeAccordion, setActiveAccordion] = useState<string | null>("description");
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

    if (!isOpen) return null;

    // Data Processing to match Storefront Logic
    const allImages = [data.imageUrl, ...data.gallery].filter(Boolean);
    if (allImages.length === 0) allImages.push("/placeholder.jpg");
    
    const hasSale = data.salePrice && parseFloat(data.salePrice) < parseFloat(data.originalPrice);
    const displayPrice = hasSale ? parseFloat(data.salePrice) : parseFloat(data.originalPrice || "0");
    const displayComparePrice = hasSale ? parseFloat(data.originalPrice) : null;
    const salePercent = displayComparePrice ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100) : 0;
    const savedAmount = displayComparePrice ? displayComparePrice - displayPrice : 0;

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <AnimatePresence>
            <div className="preview-overlay" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(10px)'
            }}>
                {/* Control Bar */}
                <div style={{ 
                    padding: '12px 24px', 
                    background: '#12403C', 
                    color: '#fff', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '13px' }}>Product Page Mirror</span>
                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px' }}>
                            <button 
                                onClick={() => setViewMode('desktop')}
                                style={{ padding: '6px 12px', border: 'none', background: viewMode === 'desktop' ? '#fff' : 'transparent', color: viewMode === 'desktop' ? '#12403C' : '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >Desktop</button>
                            <button 
                                onClick={() => setViewMode('mobile')}
                                style={{ padding: '6px 12px', border: 'none', background: viewMode === 'mobile' ? '#fff' : 'transparent', color: viewMode === 'mobile' ? '#12403C' : '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                            >Mobile</button>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#fff', color: '#12403C', border: 'none', padding: '8px 20px', borderRadius: '100px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>Close Preview</button>
                </div>

                {/* Content Scoped Storefront Environment */}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: viewMode === 'desktop' ? '40px' : '20px 0',
                    display: 'flex',
                    justifyContent: 'center',
                    background: '#FCF8F3' // The LegaCy light background
                }}>
                    <div className={`storefront-scope ${viewMode === 'mobile' ? 'mobile-frame' : ''}`} style={{
                        width: viewMode === 'desktop' ? '1300px' : '390px',
                        maxWidth: '100%',
                        background: '#fff',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.2)',
                        minHeight: '100%',
                        position: 'relative'
                    }}>
                        
                        {/* THE MIRROR CONTENT STARTS HERE - LITERAL COPY OF ProductDetailsClient.tsx */}
                        <main className="product-details-page" style={{ paddingBottom: '60px' }}>
                            <div className="container" style={{ paddingTop: '20px' }}>
                                {/* Breadcrumb Mock */}
                                <nav className="breadcrumb" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                                    <span>Home</span>
                                    <span style={{ fontSize: '10px' }}>{'>'}</span>
                                    <span>Shop</span>
                                    <span style={{ fontSize: '10px' }}>{'>'}</span>
                                    <span style={{ color: '#12403C', fontWeight: 600 }}>{data.name || "Product Name"}</span>
                                </nav>

                                <div className="detail-split" style={{ display: 'grid', gridTemplateColumns: viewMode === 'desktop' ? '1.2fr 1fr' : '1fr', gap: '40px' }}>
                                    
                                    {/* Gallery Section */}
                                    <div className="detail-gallery">
                                        <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '12px', overflow: 'hidden', background: '#f8f8f6' }}>
                                            <Image 
                                                src={allImages[selectedImageIndex]} 
                                                alt="Main" 
                                                fill 
                                                style={{ objectFit: 'cover' }}
                                                unoptimized
                                            />
                                            {hasSale && (
                                                <span style={{ position: 'absolute', top: '20px', left: '20px', background: '#FCF8F3', color: '#12403C', padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontStyle: 'italic', fontWeight: 900, border: '1px solid #12403C' }}>
                                                    -{salePercent}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Thumbnails */}
                                        {allImages.length > 1 && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                {allImages.map((img, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setSelectedImageIndex(idx)}
                                                        style={{ 
                                                            width: '70px', 
                                                            height: '70px', 
                                                            borderRadius: '8px', 
                                                            overflow: 'hidden', 
                                                            position: 'relative',
                                                            border: selectedImageIndex === idx ? '2px solid #12403C' : '2px solid #e5e7eb',
                                                            padding: 0,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <Image src={img} alt="thumb" fill style={{ objectFit: 'cover' }} unoptimized />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="detail-content">
                                        <div style={{ color: '#12403C', fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                                            {data.brandName || "LegaCy Premium"} • {data.categoryName || "Collection"}
                                        </div>
                                        
                                        <h1 style={{ fontSize: viewMode === 'desktop' ? '42px' : '28px', color: '#12403C', fontWeight: 500, lineHeight: 1.2, marginBottom: '16px', fontFamily: 'serif' }}>
                                            {data.name || "Luxury Timepiece"}
                                        </h1>

                                        {/* Stars Mock */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                            <div style={{ display: 'flex', color: '#d4af37' }}>
                                                {[1,2,3,4,5].map(s => <Star key={s} size={16} fill="#d4af37" />)}
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#6b7280' }}>(12 Reviews)</span>
                                        </div>

                                        {/* Price Block */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', background: 'rgba(18, 64, 60, 0.03)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(18, 64, 60, 0.05)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '32px', fontWeight: 700, color: '#12403C' }}>{formatPrice(displayPrice)}</span>
                                            </div>
                                            {displayComparePrice && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '18px' }}>{formatPrice(displayComparePrice)}</span>
                                                        <span style={{ background: '#12403C', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>{salePercent}% OFF</span>
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#12403C' }}>SAVE {formatPrice(savedAmount)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Short Desc */}
                                        <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.7, marginBottom: '32px' }}>
                                            {data.description || "A masterpiece of engineering and style, crafted for the modern individual who values both precision and elegance."}
                                        </p>

                                        {/* Main Actions */}
                                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', height: '54px', border: '1px solid #12403C', borderRadius: '100px', padding: '0 4px', alignItems: 'center' }}>
                                                <button style={{ width: '40px', background: 'none', border: 'none', fontSize: '20px', color: '#12403C', cursor: 'pointer' }}>-</button>
                                                <span style={{ width: '40px', textAlign: 'center', fontWeight: 700, color: '#12403C' }}>1</span>
                                                <button style={{ width: '40px', background: 'none', border: 'none', fontSize: '20px', color: '#12403C', cursor: 'pointer' }}>+</button>
                                            </div>
                                            <button style={{ flex: 1, background: '#12403C', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 700, letterSpacing: '1px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                                                <ShoppingCart size={18} /> ADD TO CART
                                            </button>
                                        </div>
                                        <button style={{ width: '100%', height: '54px', border: '1px solid #12403C', color: '#12403C', background: 'none', borderRadius: '100px', fontWeight: 700, letterSpacing: '1px', fontSize: '14px', marginBottom: '32px', cursor: 'pointer' }}>
                                            BUY IT NOW
                                        </button>

                                        {/* Trust Badges */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '24px 0', borderTop: '1px solid #eef2f6', borderBottom: '1px solid #eef2f6', marginBottom: '32px' }}>
                                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <RotateCcw size={20} color="#d4af37" />
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase' }}>14 Days Return</span>
                                            </div>
                                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <ShieldCheck size={20} color="#d4af37" />
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase' }}>Secure Payment</span>
                                            </div>
                                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <Star size={20} color="#d4af37" />
                                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#12403C', textTransform: 'uppercase' }}>Authentic Only</span>
                                            </div>
                                        </div>

                                        {/* Accordions */}
                                        <div className="product-accordions">
                                            {/* Description */}
                                            <div style={{ borderBottom: '1px solid #eef2f6' }}>
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === 'description' ? null : 'description')}
                                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <span style={{ fontWeight: 700, color: '#12403C', textTransform: 'uppercase', fontSize: '13px' }}>Description</span>
                                                    {activeAccordion === 'description' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                                <AnimatePresence>
                                                    {activeAccordion === 'description' && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                            <div style={{ paddingBottom: '20px', color: '#6b7280', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                                                {data.detailedDescription || data.description || "No description provided."}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Specs */}
                                            <div style={{ borderBottom: '1px solid #eef2f6' }}>
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === 'specs' ? null : 'specs')}
                                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <span style={{ fontWeight: 700, color: '#12403C', textTransform: 'uppercase', fontSize: '13px' }}>Specifications</span>
                                                    {activeAccordion === 'specs' ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                                </button>
                                                <AnimatePresence>
                                                    {activeAccordion === 'specs' && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                            <div className="specs-grid" style={{ paddingBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                                {Object.entries(data.specs).filter(([_,v]) => v).map(([key, val]) => (
                                                                    <React.Fragment key={key}>
                                                                        <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                                                        <span style={{ fontSize: '12px', color: '#12403C', fontWeight: 600 }}>{val}</span>
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Shipping */}
                                            <div style={{ borderBottom: '1px solid #eef2f6' }}>
                                                <button 
                                                    onClick={() => setActiveAccordion(activeAccordion === 'shipping' ? null : 'shipping')}
                                                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <span style={{ fontWeight: 700, color: '#12403C', textTransform: 'uppercase', fontSize: '13px' }}>Shipping & Returns</span>
                                                    {activeAccordion === 'shipping' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                                <AnimatePresence>
                                                    {activeAccordion === 'shipping' && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                            <div style={{ paddingBottom: '20px' }}>
                                                                {[
                                                                    { Icon: Truck, text: 'Free Shipping on eligible orders' },
                                                                    { Icon: Package, text: 'Carefully packaged in premium LegaCy box' },
                                                                    { Icon: RefreshCw, text: 'Easy 14-day exchange or return policy' }
                                                                ].map((item, i) => (
                                                                    <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                                                                        <item.Icon size={16} color="#d4af37" />
                                                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>

                <style jsx global>{`
                    .storefront-scope {
                        font-family: 'Inter', sans-serif;
                    }
                    .storefront-scope h1, .storefront-scope h2 {
                        font-family: 'Playfair Display', serif;
                    }
                    .mobile-frame {
                        border: 8px solid #333;
                        border-radius: 40px;
                        margin: 20px 0;
                        height: 800px;
                        max-height: 85vh;
                    }
                    .storefront-scope .main-image-wrapper {
                        overflow: hidden;
                        cursor: zoom-in;
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
}
