"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useIsClient } from "@/hooks/useIsClient";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, removeFromCart, addToCart, decFromCart } = useStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

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

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  return (
    <>
      <div 
        className={`${styles.overlay} ${isCartOpen ? styles.open : ""}`} 
        onClick={closeCart}
        aria-hidden="true"
      />
      
      <div 
        className={`${styles.drawer} ${isCartOpen ? styles.open : ""}`}
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Your Bag ({cart.reduce((a, c) => a + c.qty, 0)})</h2>
          <button onClick={closeCart} className={styles.closeBtn} aria-label="Close cart">
            &times;
          </button>
        </div>

        <div className={styles.body}>
          {cart.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Your bag is empty.</p>
              <button 
                onClick={closeCart} 
                className="btn btn-primary"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              {cart.map((item, index) => (
                <div key={`${item.id}-${index}`} className={styles.item}>
                  <Link href={`/product/${item.id}`} onClick={closeCart}>
                    <Image 
                      src={item.img || '/globe.svg'} 
                      alt={item.name} 
                      width={100} 
                      height={120} 
                      className={styles.itemImage}
                    />
                  </Link>
                  <div className={styles.itemDetails}>
                    
                    <div className={styles.topRow}>
                      <div>
                        <Link href={`/product/${item.id}`} onClick={closeCart} style={{ textDecoration: 'none' }}>
                           <h4 className={styles.itemName}>{item.name}</h4>
                        </Link>
                        <span className={styles.itemPrice}>${item.price.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className={styles.removeBtn}
                        aria-label="Remove item"
                        title="Remove Item"
                      >
                         <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>

                    <div className={styles.itemControls}>
                      <div className={styles.qtyControls}>
                        <button onClick={() => decFromCart(item.id)} className={styles.qtyBtn} aria-label="Decrease quantity">-</button>
                        <span className={styles.qtyValue}>{item.qty}</span>
                        <button onClick={() => addToCart(item.id)} className={styles.qtyBtn} aria-label="Increase quantity">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Subtotal</span>
              <span className={styles.totalAmount}>${total.toLocaleString()}</span>
            </div>
            <div className={styles.actionButtons}>
              <Link 
                href="/cart" 
                className={styles.viewCartBtn}
                onClick={closeCart}
              >
                View Cart
              </Link>
              <button 
                className={styles.checkoutBtn}
                onClick={() => {
                   alert("Proceeding to Checkout...");
                }}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
