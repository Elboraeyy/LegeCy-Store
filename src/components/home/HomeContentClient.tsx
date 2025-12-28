"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import type { HomepageSettings } from "@/lib/settings";

type Props = {
  homepage: HomepageSettings;
  storeName: string;
};

export function HomeContentClient({ homepage, storeName }: Props) {
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
              <h2 className="legacy-title">A Legacy of <br /> Precision</h2>
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
