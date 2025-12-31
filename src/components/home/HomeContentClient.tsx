"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import ProductCarousel from "@/components/ProductCarousel";
import type { HomepageSettings } from "@/lib/settings";
import type { Product } from "@/types/product";

type Props = {
  homepage: HomepageSettings;
  storeName: string;
  featuredProducts: Product[];
  newArrivals: Product[];
};

export function HomeContentClient({ homepage, storeName, featuredProducts, newArrivals }: Props) {
  return (
    <main>
      {/* Hero Section */}
      {homepage.heroEnabled && (
        <section 
          className="hero container"
          style={homepage.heroBackgroundImage ? {
            backgroundImage: `url('${homepage.heroBackgroundImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        >
          <div className="hero-content">
            <Reveal delay={0.1}>
              <h1 className="hero-title">
                {homepage.heroTitle.split('.').map((part, i) => (
                  <React.Fragment key={i}>
                    {part.trim()}{i < homepage.heroTitle.split('.').length - 1 && '.'}<br />
                  </React.Fragment>
                ))}
              </h1>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="hero-sub">
                {homepage.heroSubtitle}
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <Link href={homepage.heroButtonLink || "/shop"} className="btn btn-primary">
                {homepage.heroButtonText}
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* Featured Products Carousel */}
      {featuredProducts && featuredProducts.length > 0 && (
        <ProductCarousel
          products={featuredProducts}
          title="Featured Collection"
          subtitle="Handpicked for You"
          viewAllLink="/shop"
        />
      )}

      {/* Collection Section */}
      <section className="container collection-section">
        <motion.div 
          className="grid collection-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainerSlow}
        >
          <motion.div className="collection-card large" variants={fadeUpSlow}>
            <div className="collection-media" style={{ backgroundImage: "url('/image/download (4).jpeg')" }}>
            </div>
            <div className="collection-overlay">
              <Reveal>
                <h3>The Luxury Collection</h3>
              </Reveal>
              <Reveal delay={0.1}>
                <Link href="/shop" className="btn-link">View More</Link>
              </Reveal>
            </div>
          </motion.div>
          <motion.div className="collection-card" variants={fadeUpSlow}>
            <div className="collection-media"
              style={{ backgroundImage: "url('/image/BUREI Green Sun_Emerald dial, golden stainless….jpeg')" }}>
            </div>
            <div className="collection-overlay">
              <Reveal>
                <h3>Modern Classics</h3>
              </Reveal>
              <Reveal delay={0.1}>
                 <Link href="/shop" className="btn-link">View More</Link>
              </Reveal>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* New Arrivals Carousel */}
      {newArrivals && newArrivals.length > 0 && (
        <ProductCarousel
          products={newArrivals}
          title="New Arrivals"
          subtitle="Just Dropped"
          viewAllLink="/shop"
        />
      )}

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <motion.div 
            className="trust-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainerSlow}
          >
            <motion.div className="trust-item" variants={fadeUpSlow}>
              <div className="trust-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>100%</h4>
              <p>Authentic Products</p>
            </motion.div>
            <motion.div className="trust-item" variants={fadeUpSlow}>
              <div className="trust-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h4>24/7</h4>
              <p>Customer Support</p>
            </motion.div>
            <motion.div className="trust-item" variants={fadeUpSlow}>
              <div className="trust-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13"/>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
              </div>
              <h4>Free</h4>
              <p>Fast Shipping</p>
            </motion.div>
            <motion.div className="trust-item" variants={fadeUpSlow}>
              <div className="trust-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <h4>5000+</h4>
              <p>Happy Customers</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Legacy Section */}
      <section className="container legacy-section">
        <div className="legacy-wrapper">
          <div className="legacy-image-wrapper">
             <Reveal width="100%" fullHeight>
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Image
                    src="/image/legacy-watch.jpeg"
                    alt={`${storeName} Heritage`}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="legacy-image-overlay"></div>
                </div>
             </Reveal>
          </div>
          <div className="legacy-text-content">
            <Reveal delay={0.2}>
              <span className="legacy-subtitle">Since 1839</span>
            </Reveal>
            <Reveal delay={0.3}>
              <h2 className="legacy-title">A Legacy of <br />Precision</h2>
            </Reveal>
            <Reveal delay={0.4}>
              <p className="legacy-description">
                For those who value eternity over the momentary. {storeName} curates timepieces that are not just
                instruments of time, but guardians of history.
              </p>
            </Reveal>
            <Reveal delay={0.5}>
              <Link href="/about" className="btn-link-gold">DISCOVER OUR HERITAGE</Link>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
