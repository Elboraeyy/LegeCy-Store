"use client";

import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Product, getLocalized } from "@/types/product";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import { useLanguage } from "@/context/LanguageContext";
import { optimizeCloudinaryUrl } from "@/lib/utils/image";
import { CartIcon } from "@/components/icons/CartIcon";
import { trackGAEvent } from "@/components/GoogleAnalytics";
import styles from "./ProductQuickView.module.css";

interface ProductQuickViewProps {
    product: Product;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductQuickView({ product, isOpen, onClose }: ProductQuickViewProps) {
    const { addToCart, toggleFav, isFav, setBuyNowItem } = useStore();
    const isClient = useIsClient();
    const { t, language } = useLanguage();
    const router = useRouter();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [justAdded, setJustAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // Reset state during render when product changes to avoid cascading renders
    const [prevProductId, setPrevProductId] = useState(product.id);
    if (product.id !== prevProductId) {
        setPrevProductId(product.id);
        setSelectedImageIndex(0);
        setJustAdded(false);
        setQuantity(1);
    }

    // Build gallery images
    const allImages = React.useMemo(() => {
        const imgs: string[] = [];
        const mainImg = product.imageUrl || product.img;
        if (mainImg) imgs.push(mainImg);
        const gallery = product.gallery || product.images || [];
        gallery.forEach((img: string) => {
            if (img && !imgs.includes(img)) imgs.push(img);
        });
        return imgs.length > 0 ? imgs : ["/placeholder.jpg"];
    }, [product]);

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollBarWidth}px`;
            // Prevent scroll on html as well for better mobile support
            document.documentElement.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            document.documentElement.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            document.documentElement.style.overflow = "";
        };
    }, [isOpen]);

    // ESC key to close
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) onClose();
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-EG", {
            style: "currency",
            currency: "EGP",
        }).format(p);
    };

    const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const isOutOfStock = product.inStock === false;
    const isNew = product.isNew;
    const salePercent = isOnSale
        ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
        : 0;

    const productName = getLocalized(product, language as "en" | "ar", "name");
    const productDesc = getLocalized(product, language as "en" | "ar", "description");
    const productCategory = getLocalized(product, language as "en" | "ar", "category");

    const handleQuantityChange = (delta: number) => {
        setQuantity((prevQty) => {
            const newQty = prevQty + delta;
            const maxStock = product.totalStock || 1; // Assuming minimum stock is 1 if not defined
            return Math.max(1, Math.min(newQty, maxStock));
        });
    };

    const handleAddToCart = () => {
        if (isOutOfStock) return;
        addToCart(String(product.id), undefined, true, quantity);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1800);
        trackGAEvent("add_to_cart", {
            currency: "EGP",
            value: product.price * quantity,
            items: [
                {
                    item_id: product.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: quantity,
                },
            ],
        });
    };

    const handleBuyNow = () => {
        if (isOutOfStock) return;
        trackGAEvent('begin_checkout', {
            currency: 'EGP',
            value: product.price * quantity,
            items: [{
                item_id: product.id,
                item_name: product.name,
                price: product.price,
                quantity: quantity,
            }],
        });
        setBuyNowItem({
            id: String(product.id),
            variantId: '',
            qty: quantity,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl || '',
            img: product.imageUrl || product.img || '',
            stock: product.totalStock || 1,
        });
        onClose();
        router.push('/checkout');
    };

    const handleToggleFav = () => {
        toggleFav(String(product.id));
    };

    if (!isClient) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, scale: 0.92, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 40 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={t.product.quick_view?.title || "Quick View"}
                    >
                        {/* Close Button */}
                        <button className={styles.closeBtn} onClick={onClose} aria-label={t.product.quick_view?.close || "Close"}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        {/* Image Section */}
                        <div className={styles.imageSection}>
                            <motion.div
                                className={styles.sliderContainer}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(_, info) => {
                                    const threshold = 50;
                                    if (info.offset.x < -threshold && selectedImageIndex < allImages.length - 1) {
                                        setSelectedImageIndex(prev => prev + 1);
                                    } else if (info.offset.x > threshold && selectedImageIndex > 0) {
                                        setSelectedImageIndex(prev => prev - 1);
                                    }
                                }}
                                animate={{ x: `-${selectedImageIndex * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                            >
                                {allImages.map((img, idx) => (
                                    <div key={idx} className={styles.slideItem}>
                                        <Image
                                            src={optimizeCloudinaryUrl(img, 700)}
                                            alt={`${productName} ${idx + 1}`}
                                            fill
                                            className={styles.mainImage}
                                            sizes="(max-width: 767px) 100vw, 45vw"
                                            priority={idx === 0}
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            {/* Badges */}
                            <div className={styles.badges}>
                                {isOutOfStock ? (
                                    <span className={`${styles.badge} ${styles.badgeSoldOut}`}>{t.product.sold_out}</span>
                                ) : (
                                    <>
                                        {isOnSale && (
                                            <span className={`${styles.badge} ${styles.badgeSale}`}>-{salePercent}%</span>
                                        )}
                                        {isNew && !isOnSale && (
                                            <span className={`${styles.badge} ${styles.badgeNew}`}>{t.product.new_arrival}</span>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {allImages.length > 1 && (
                                <div className={styles.thumbnails}>
                                    {allImages.slice(0, 5).map((img, idx) => (
                                        <button
                                            key={idx}
                                            className={`${styles.thumb} ${selectedImageIndex === idx ? styles.thumbActive : ""}`}
                                            onClick={() => setSelectedImageIndex(idx)}
                                        >
                                            <Image
                                                src={optimizeCloudinaryUrl(img, 100)}
                                                alt={`${productName} ${idx + 1}`}
                                                width={44}
                                                height={44}
                                                className={styles.thumbImg}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className={styles.content}>
                            <div className={styles.header}>
                                {productCategory && <span className={styles.brand}>{productCategory}</span>}
                                <h2 className={styles.productName}>{productName}</h2>
                            </div>

                            {/* Price */}
                            <div className={styles.priceRow}>
                                <span className={styles.price}>{formatPrice(product.price)}</span>
                                {isOnSale && (
                                    <>
                                        <span className={styles.comparePrice}>{formatPrice(product.compareAtPrice!)}</span>
                                        <span className={styles.saleBadge}>{t.product.sale} -{salePercent}%</span>
                                    </>
                                )}
                            </div>

                            <div className={styles.divider} />

                            {/* Description */}
                            {productDesc && <p className={styles.description}>{productDesc}</p>}

                            {/* Stock & Quantity Row */}
                            <div className={styles.stockRow}>
                                <div className={`${styles.stockStatus} ${isOutOfStock ? styles.outOfStock : styles.inStock}`}>
                                    <span className={styles.stockDot} />
                                    <span>{isOutOfStock ? t.product.out_of_stock : t.product.in_stock}</span>
                                </div>

                                {!isOutOfStock && (
                                    <div className={styles.qtySelector}>
                                        <button
                                            onClick={() => handleQuantityChange(-1)}
                                            disabled={quantity <= 1}
                                            className={styles.qtyBtn}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M5 12h14" />
                                            </svg>
                                        </button>
                                        <span className={styles.qtyValue}>{quantity}</span>
                                        <button
                                            onClick={() => handleQuantityChange(1)}
                                            disabled={quantity >= (product?.totalStock || 0)}
                                            className={styles.qtyBtn}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M12 5v14M5 12h14" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className={styles.actions}>
                                <div className={styles.addToCartRow}>
                                    {!isOutOfStock ? (
                                        <button
                                            className={styles.buyNowBtn}
                                            onClick={handleBuyNow}
                                        >
                                            {t.product.buy_now}
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.addToCartBtn}
                                            disabled
                                        >
                                            {t.product.out_of_stock}
                                        </button>
                                    )}

                                    <button
                                        className={`${styles.favBtn} ${isFav(String(product.id)) ? styles.favBtnActive : ""}`}
                                        onClick={handleToggleFav}
                                        aria-label={t.product.favorite}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill={isFav(String(product.id)) ? "currentColor" : "none"}
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>

                                {!isOutOfStock && (
                                    <div className={styles.secondaryActionsRow}>
                                        <button
                                            className={styles.addToCartBtn}
                                            onClick={handleAddToCart}
                                        >
                                            <CartIcon className="w-[18px] h-[18px]" />
                                            {justAdded
                                                ? t.product.added_to_cart
                                                : (t.product.quick_view?.add_to_cart || t.product.add_to_cart)}
                                        </button>

                                        <Link
                                            href={`/product/${product.id}`}
                                            className={styles.viewDetailsBtn}
                                            onClick={onClose}
                                        >
                                            <span className={styles.longText}>{t.product.quick_view?.view_details || t.product.view_details}</span>
                                            <span className={styles.shortText}>{language === 'ar' ? 'التفاصيل' : 'Details'}</span>
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                style={{ transform: language === "ar" ? "scaleX(-1)" : undefined }}
                                            >
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}

                                {isOutOfStock && (
                                    <Link
                                        href={`/product/${product.id}`}
                                        className={styles.viewDetailsBtn}
                                        onClick={onClose}
                                    >
                                        <span className={styles.longText}>{t.product.quick_view?.view_details || t.product.view_details}</span>
                                        <span className={styles.shortText}>{language === 'ar' ? 'التفاصيل' : 'Details'}</span>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            style={{ transform: language === "ar" ? "scaleX(-1)" : undefined }}
                                        >
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
