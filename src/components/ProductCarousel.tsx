"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/product";

interface ProductCarouselProps {
  products: Product[];
  title: string;
  subtitle?: string;
  viewAllLink?: string;
}

export default function ProductCarousel({ 
  products, 
  title, 
  subtitle,
  viewAllLink = "/shop" 
}: ProductCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        carousel.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const cardWidth = 320; // Approximate card width + gap
      const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="carousel-section">
      <div className="container">
        {/* Section Header */}
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-title-area">
            {subtitle && <span className="section-subtitle">{subtitle}</span>}
            <h2 className="section-title">{title}</h2>
          </div>
          <a href={viewAllLink} className="view-all-link">
            View All
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </motion.div>

        {/* Carousel Wrapper */}
        <div className="carousel-wrapper">
          {/* Left Arrow */}
          <button 
            className={`carousel-arrow carousel-arrow-left ${!canScrollLeft ? 'hidden' : ''}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          {/* Carousel Track */}
          <motion.div 
            ref={carouselRef}
            className="carousel-track"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            {products.map((product, index) => (
              <motion.div 
                key={product.id}
                className="carousel-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* Right Arrow */}
          <button 
            className={`carousel-arrow carousel-arrow-right ${!canScrollRight ? 'hidden' : ''}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Gradient Fades */}
          <div className={`carousel-fade carousel-fade-left ${!canScrollLeft ? 'hidden' : ''}`} />
          <div className={`carousel-fade carousel-fade-right ${!canScrollRight ? 'hidden' : ''}`} />
        </div>
      </div>
    </section>
  );
}
