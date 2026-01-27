"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { useIsClient } from "@/hooks/useIsClient";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, addToCart, decFromCart } = useStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const { t, language } = useLanguage();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isCartOpen, closeCart]);

  // Lock body scroll when open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  if (!isClient) return null;

  const itemCount = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const total = subtotal;

  const formatPrice = (p: number) => {
    return language === 'ar'
      ? `${p.toLocaleString('en-US')} ${t.common.currency}`
      : `${t.common.currency} ${p.toLocaleString('en-US')}`;
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isCartOpen ? styles.open : ""}`} 
        onClick={closeCart}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div 
        className={`${styles.drawer} ${isCartOpen ? styles.open : ""}`}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              {t.cart.your_cart}
              {itemCount > 0 && (
                <span className={styles.itemCount}>{t.cart.items_count.replace('{count}', itemCount.toString())}</span>
              )}
            </h2>
          </div>
          <button onClick={closeCart} className={styles.closeBtn} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <h3>{t.cart.empty_cart}</h3>
              <p>{t.cart.empty_desc}</p>
              <Link href="/shop" onClick={closeCart} className={styles.emptyBtn}>
                {t.cart.continue_shopping}
              </Link>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className={styles.item}>
                  <Link href={`/product/${item.id}`} onClick={closeCart} className={styles.itemImageWrapper}>
                    <Image 
                      src={item.img || '/globe.svg'} 
                      alt={item.name} 
                      width={80}
                      height={100} 
                      className={styles.itemImage}
                    />
                  </Link>
                  <div className={styles.itemDetails}>
                    <div className={styles.topRow}>
                      <div className={styles.itemInfo}>
                        <Link href={`/product/${item.id}`} onClick={closeCart} style={{ textDecoration: 'none' }}>
                          <h4 className={styles.itemName}>{item.name}</h4>
                        </Link>
                        <span className={styles.itemPrice}>{formatPrice(item.price)}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className={styles.removeBtn}
                        aria-label="Remove item"
                        title="Remove"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <div className={styles.itemControls}>
                      <div className={styles.qtyControls}>
                        <button
                          onClick={() => decFromCart(item.id)}
                          className={styles.qtyBtn}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{item.qty}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className={styles.qtyBtn}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <span className={styles.itemTotal}>
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className={styles.footer}>
            {/* Summary */}
            <div className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>{t.cart.subtotal}</span>
                <span className={styles.summaryValue}>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>{t.cart.subtotal}</span>
                <span className={styles.totalAmount}>{formatPrice(total)}</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                {t.cart.shipping_calculated_checkout}
              </p>
            </div>

            {/* Buttons */}
            <div className={styles.actionButtons}>
              <Link 
                href="/checkout"
                className={styles.checkoutBtn}
                onClick={closeCart}
              >
                {t.cart.checkout}
              </Link>
              <Link 
                href="/cart" 
                className={styles.viewCartBtn}
                onClick={closeCart}
              >
                {t.cart.view_cart}
              </Link>
            </div>

            {/* Trust Badges */}
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {t.product.trust.secure}
              </div>
              <div className={styles.trustBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t.product.trust.authentic}
              </div>
              <div className={styles.trustBadge}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {t.product.shipping_list.delivery}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
