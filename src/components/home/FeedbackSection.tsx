/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FeedbackSectionProps {
  images: string[];
  reviewStats: { rating: number; count: number };
}

export function FeedbackSection({ images, reviewStats }: FeedbackSectionProps) {
  const { t, direction } = useLanguage();
  const isRTL = direction === "rtl";

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index % (images.length || 1));
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const showNextImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === null ? null : (prev + 1) % (images.length || 1)));
  }, [images.length]);

  const showPrevImage = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === null ? null : (prev - 1 + (images.length || 1)) % (images.length || 1)));
  }, [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") {
        if (isRTL) showPrevImage();
        else showNextImage();
      }
      if (e.key === "ArrowLeft") {
        if (isRTL) showNextImage();
        else showPrevImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, isRTL, showNextImage, showPrevImage]);

  if (images.length === 0) return null;

  // Duplicate list to guarantee seamless continuous infinite loop
  const displayImages = images.length < 6 ? [...images, ...images, ...images] : images;

  return (
    <section className="py-3 md:py-4 bg-[#12403C] overflow-hidden relative select-none w-full shrink-0 shadow-lg border-t border-[#d4af37]/20">
      {/* Visual background details */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 mb-2 md:mb-3 relative z-10 text-center">
        {/* Rating Stars decoration */}
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => {
              const fillPercentage = Math.max(0, Math.min(100, (reviewStats.rating - i) * 100));
              return (
                <div key={i} className="relative w-3.5 h-3.5 md:w-4 md:h-4 text-white/20 flex-shrink-0">
                  {/* Background Empty Star */}
                  <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/20 absolute top-0 left-0" />
                  
                  {/* Foreground Gold Star */}
                  <div 
                    className="absolute top-0 left-0 h-full overflow-hidden select-none pointer-events-none"
                    style={{ width: `${fillPercentage}%` }}
                  >
                    <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-[#d4af37] text-[#d4af37] max-w-none absolute top-0 left-0" />
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[11px] md:text-xs text-[#d4af37] font-medium tracking-wide">
            {reviewStats.rating.toFixed(1)} / 5 ({reviewStats.count} {isRTL ? "تقييم" : "reviews"})
          </span>
        </div>

        {/* Section Headings */}
        <h2 className="text-base md:text-xl font-heading text-white mb-0.5 tracking-wide">
          {t.home.feedback?.title || "What Our Clients Say"}
        </h2>
        <p className="text-[10px] md:text-xs text-[#FCF8F3]/70 max-w-xl mx-auto font-light">
          {t.home.feedback?.subtitle || "Real conversations, real trust. See what our clients say about their experience."}
        </p>
      </div>

      {/* Ticker Track Container with Hardware-Accelerated Continuous Marquee */}
      <div className="w-full overflow-hidden relative z-10 py-0.5 feedback-marquee-track">
        {/* Left & Right gradient overlays to give a professional fade effect */}
        <div className="absolute top-0 left-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-[#12403C] to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-[#12403C] to-transparent z-20 pointer-events-none" />

        <div className="w-full overflow-hidden whitespace-nowrap relative flex items-center select-none">
          {/* Primary Track */}
          <div className="inline-flex animate-feedback-marquee shrink-0 items-center gap-2.5 md:gap-4 px-1.5 md:px-2">
            {displayImages.map((src, idx) => (
              <div
                key={`f1-${src}-${idx}`}
                className="inline-block flex-shrink-0 cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <div className="h-[70px] md:h-[90px] w-auto relative rounded-xl overflow-hidden border border-[#d4af37]/15 bg-white/5 backdrop-blur-sm p-1 shadow-md transition-all duration-300 hover:scale-[1.05] hover:border-[#d4af37]/50 hover:shadow-[#d4af37]/10 group flex items-center justify-center cursor-zoom-in">
                  <img
                    src={src}
                    alt={`Client feedback ${idx}`}
                    draggable={false}
                    className="h-full w-auto object-contain rounded-lg pointer-events-none select-none transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Duplicate Track for Infinite Seamless Loop */}
          <div className="inline-flex animate-feedback-marquee shrink-0 items-center gap-2.5 md:gap-4 px-1.5 md:px-2" aria-hidden="true">
            {displayImages.map((src, idx) => (
              <div
                key={`f2-${src}-${idx}`}
                className="inline-block flex-shrink-0 cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <div className="h-[70px] md:h-[90px] w-auto relative rounded-xl overflow-hidden border border-[#d4af37]/15 bg-white/5 backdrop-blur-sm p-1 shadow-md transition-all duration-300 hover:scale-[1.05] hover:border-[#d4af37]/50 hover:shadow-[#d4af37]/10 group flex items-center justify-center cursor-zoom-in">
                  <img
                    src={src}
                    alt={`Client feedback duplicate ${idx}`}
                    draggable={false}
                    className="h-full w-auto object-contain rounded-lg pointer-events-none select-none transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center cursor-zoom-out"
          >
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-[#d4af37] hover:text-[#12403C] transition-all duration-300 z-[10000] shadow-md"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Left */}
            <button
              onClick={isRTL ? showNextImage : showPrevImage}
              className="absolute left-4 md:left-8 p-3 rounded-full bg-white/10 text-white hover:bg-[#d4af37] hover:text-[#12403C] transition-all duration-300 z-[10000] shadow-md cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Lightbox Image Content */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative max-w-[90vw] max-h-[85vh] z-[9999] p-2 bg-[#12403C]/20 border border-[#d4af37]/25 rounded-2xl shadow-2xl flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image frame
            >
              <img
                src={images[selectedImageIndex]}
                alt="Client feedback zoom"
                className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
              />
              {/* Image counter indicator */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-xs font-mono tracking-wider bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </motion.div>

            {/* Navigation Right */}
            <button
              onClick={isRTL ? showPrevImage : showNextImage}
              className="absolute right-4 md:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-[#d4af37] hover:text-[#12403C] transition-all duration-300 z-[10000] shadow-md cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hide Scrollbar styling inside component */}
      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
