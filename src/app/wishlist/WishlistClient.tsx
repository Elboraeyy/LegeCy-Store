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


export default function WishlistClient() {
  const router = useRouter();
  const { fav, products, addToCart, toggleFav } = useStore();
  const isClient = useIsClient();

  const favProducts = products.filter((p) => fav.includes(p.id));
  const formatPrice = (p: number) => `$${p.toFixed(2)}`;

  if (!isClient) return null;

  return (

 
      <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
             <h1 className="fade-in">Your Wishlist</h1>
          </Reveal>
          <Reveal delay={0.2}>
             <p className="fade-in">A curated selection of timepieces you admire.</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        {favProducts.length === 0 ? (
          <Reveal width="100%">
            <div className="empty-state">
              <h3>Your wish list is empty</h3>
              <p>
                Explore our{" "}
                <Link
                  href="/shop"
                  style={{ color: "var(--accent)", textDecoration: "underline" }}
                >
                  Collection
                </Link>{" "}
                and find your perfect timepiece.
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
            {favProducts.map((p) => (
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
                        title="View Details"
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
                        title="Add to Cart"
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
                      <button
                        className="btn-icon"
                        title="Remove"
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
