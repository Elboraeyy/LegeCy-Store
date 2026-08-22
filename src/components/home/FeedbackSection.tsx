"use client";

import React, { useRef, useState, useEffect } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const isPaused = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const dragDistance = useRef(0);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Duplicate images for infinite scrolling effect
  const doubledImages = [...images, ...images];

  // Auto-scroll loop
  useEffect(() => {
    if (!containerRef.current || images.length === 0) return;

    const animate = () => {
      if (containerRef.current && !isPaused.current && !isDragging.current) {
        const container = containerRef.current;
        const scrollWidth = container.scrollWidth;
        const halfWidth = scrollWidth / 2;

        if (isRTL) {
          // Decrement scrollLeft (move left in RTL, towards negative values)
          container.scrollLeft -= 0.6;

          // Reset when scrolled past halfWidth to the left
          if (container.scrollLeft <= -halfWidth) {
            container.scrollLeft += halfWidth;
          }
          // Reset when dragged right past 0
          else if (container.scrollLeft > 0) {
            container.scrollLeft -= halfWidth;
          }
        } else {
          // Increment scrollLeft (move right in LTR, towards positive values)
          container.scrollLeft += 0.6;

          // Reset when scrolled past halfWidth to the right
          if (container.scrollLeft >= halfWidth) {
            container.scrollLeft -= halfWidth;
          }
          // Reset when dragged left past 0
          else if (container.scrollLeft < 0) {
            container.scrollLeft += halfWidth;
          }
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [images, isRTL]);

  // Desktop Drag-to-Scroll implementation
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDragging.current = true;
    isPaused.current = true;
    startX.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftStart.current = containerRef.current.scrollLeft;
    dragDistance.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    // Invert the drag direction in RTL because scrollLeft decreases to scroll left
    const walk = (x - startX.current) * 1.5 * (isRTL ? -1 : 1);
    dragDistance.current = Math.abs(x - startX.current);
    containerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    // Brief delay before resuming auto-scroll to make interaction feel natural
    setTimeout(() => {
      if (!isDragging.current) {
        isPaused.current = false;
      }
    }, 1500);
  };

  const handleTouchStart = () => {
    isPaused.current = true;
  };

  const handleTouchEnd = () => {
    setTimeout(() => {
      isPaused.current = false;
    }, 1500);
  };

  const openLightbox = (index: number) => {
    // If the user was dragging, don't open the lightbox
    if (dragDistance.current > 10) return;
    // Map index of doubled array back to original index
    const originalIndex = index % images.length;
    setSelectedImageIndex(originalIndex);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const showNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % images.length);
  };

  const showPrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
  };

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
  }, [selectedImageIndex, isRTL]);

  if (images.length === 0) return null;

  return (
    <section className="py-2 md:py-3.5 bg-[#12403C] overflow-hidden relative select-none w-full shrink-0 shadow-lg border-t border-[#d4af37]/20">
      {/* Visual background details */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 mb-1.5 md:mb-3 relative z-10 text-center">
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
          <span className="text-[10px] md:text-xs text-[#d4af37] font-medium tracking-wide">
            {reviewStats.rating.toFixed(1)} / 5 ({reviewStats.count} {isRTL ? "تقييم" : "reviews"})
          </span>
        </div>

        {/* Section Headings */}
        <h2 className="text-sm md:text-lg font-heading text-white mb-0 tracking-wide">
          {t.home.feedback?.title || "What Our Clients Say"}
        </h2>
        <p className="text-[9px] md:text-xs text-[#FCF8F3]/70 max-w-xl mx-auto font-light">
          {t.home.feedback?.subtitle || "Real conversations, real trust. See what our clients say about their experience."}
        </p>
      </div>

      {/* Ticker Track Container */}
      <div className="w-full overflow-hidden relative z-10 py-0.5">
        {/* Left & Right gradient overlays to give a professional fade effect */}
        <div className="absolute top-0 left-0 bottom-0 w-8 md:w-32 bg-gradient-to-r from-[#12403C] to-transparent z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-8 md:w-32 bg-gradient-to-l from-[#12403C] to-transparent z-20 pointer-events-none" />

        <div
          ref={containerRef}
          className="flex gap-2 md:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none cursor-grab active:cursor-grabbing px-4 md:px-32 py-0.5"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {doubledImages.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="inline-block flex-shrink-0"
              onClick={() => openLightbox(idx)}
            >
              <div className="h-[60px] md:h-[88px] w-auto relative rounded-xl overflow-hidden border border-[#d4af37]/15 bg-white/5 backdrop-blur-sm p-1 shadow-md transition-all duration-300 hover:scale-[1.05] hover:border-[#d4af37]/50 hover:shadow-[#d4af37]/10 group flex items-center justify-center cursor-zoom-in">
                {/* Image element */}
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
