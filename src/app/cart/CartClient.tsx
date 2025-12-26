"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import { useIsClient } from "@/hooks/useIsClient";


export default function CartClient() {
  const { cart, addToCart, decFromCart, removeFromCart } = useStore();
  const isClient = useIsClient();

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  if (!isClient) return null;

  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <h1 className="fade-in">Your Cart</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="fade-in">Review your selected items before checkout</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div className="cart-layout">
          <div className="cart-items-wrapper">
            <div id="cart-box" className="cart-list">
              {cart.length === 0 ? (
                <Reveal width="100%">
                  <div className="empty-state">
                    <h3>Your cart is empty</h3>
                    <p>
                      Browse our{" "}
                      <Link
                        href="/shop"
                        style={{ color: "var(--accent)", textDecoration: "underline" }}
                      >
                        Collection
                      </Link>{" "}
                      to find your next timepiece.
                    </p>
                  </div>
                </Reveal>
              ) : (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainerSlow}
                >
                  {cart.map((item, index) => (
                    <motion.div className="cart-item" key={`${item.id}-${index}`} variants={fadeUpSlow}>
                      <Link href={`/product/${item.id}?from=cart`} style={{ cursor: "pointer" }}>
                        <Image
                          src={item.img || '/globe.svg'}
                          alt={item.name}
                          width={80}
                          height={80}
                          style={{ objectFit: "cover", borderRadius: '4px' }}
                        />
                      </Link>
                      <div className="ci-details">
                        <Link href={`/product/${item.id}?from=cart`} style={{ textDecoration: "none", color: "inherit" }}>
                          <h4 className="ci-title" style={{ cursor: "pointer" }}>{item.name}</h4>
                        </Link>
                        <p className="ci-price">{formatPrice(item.price)}</p>
                        <div className="ci-actions">
                          <div className="qty-control">
                            <button
                              className="btn-icon-sm"
                              onClick={() => decFromCart(item.id)}
                              title="Decrease"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                            <span className="qty">{item.qty}</span>
                            <button
                              className="btn-icon-sm"
                              onClick={() => addToCart(item.id)}
                              title="Increase"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          </div>
                          <button
                            className="btn-remove"
                            onClick={() => removeFromCart(item.id)}
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
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          <div className="cart-summary-wrapper">
            {cart.length > 0 && (
              <Reveal width="100%" delay={0.2}>
                <div className="cart-summary" id="cart-summary">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3>Order Summary</h3>
                  </div>

                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span id="subtotal">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span style={{ color: "#16a34a" }}>Free</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total</span>
                    <span id="total">{formatPrice(total)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    id="checkout-btn"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "24px", textAlign: "center", display: "block" }}
                  >
                    Proceed to Checkout
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
