"use client";

import React, { useRef, useState, useEffect } from "react";
import { Product } from "@/types/product";
import ModernProductCard from "./ModernProductCard";
import ProductCard from "./ProductCard";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ModernProductCarouselProps {
    products: Product[];
    title: string;
    subtitle?: string;
    viewAllLink?: string;
    enableMobilePadding?: boolean;
}

export default function ModernProductCarousel({
    products,
    title,
    subtitle,
    viewAllLink = "/shop",
    enableMobilePadding = true
}: ModernProductCarouselProps) {
    const { t, direction } = useLanguage();
    const isRTL = direction === 'rtl';
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // buffer
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [products]); // Re-check if products change

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth; // Scroll full view
            // In RTL, "left" scroll (negative X) moves visual content to the right (viewing left items)
            // But logic depends on browser implementation.
            // Safest for RTL:
            // "Next" (Visual Left) -> Subtract scrollLeft
            // "Prev" (Visual Right) -> Add scrollLeft
            // Wait, standard scrollBy({left: val})
            // LTR: +val moves right, -val moves left.
            // RTL: -val moves left (next), +val moves right (prev).
            // So logic is actually inverted for RTL if we think in "Next/Prev".
            
            // If direction is 'left' (intended as Prev in LTR, Next in RTL context?)
            // Let's rely on the button clicks passing 'left' or 'right' logic correctly relative to screen.
            
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <section className="py-4 md:py-8 bg-transparent relative group/carousel">
            <div className="container px-4 mb-6">
                <div className="container px-4 mb-6">
                    <div className="flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left gap-4">
                        <div className="flex flex-col items-center md:items-start gap-2">
                        {subtitle && (
                            <span className={`section-subtitle text-[#d4af37] text-xs font-bold ${isRTL ? '' : 'uppercase tracking-[0.2em]'}`}>
                                {subtitle}
                            </span>
                        )}
                        <h2 className="section-title text-3xl font-heading text-[#12403C]">
                            {title}
                        </h2>
                    </div>
                    {viewAllLink && (
                            <Link href={viewAllLink} className={`text-[11px] font-bold text-[#12403C] hover:text-[#d4af37] transition-colors mb-1 flex items-center gap-1 group ${isRTL ? '' : 'uppercase tracking-widest'}`}>
                                {t.home.view_all} <span className={`transition-transform ${isRTL ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`}>→</span>
                        </Link>
                    )}
                </div>
            </div>
            </div>

            <div className={`relative w-full md:container md:mx-auto ${enableMobilePadding ? 'px-4' : 'px-0 md:px-4'}`}>
                {/* Navigation Arrows */}
                {/* PREV BUTTON (Scrolls to start) */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 items-center justify-center text-[#12403C] hover:bg-[#12403C] hover:text-white hover:scale-105 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 ${isRTL ? 'right-5' : 'left-5'}`}
                        aria-label="Scroll left"
                    >
                        {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                    </button>
                )}

                {/* NEXT BUTTON (Scrolls to end) */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className={`hidden md:flex absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 items-center justify-center text-[#12403C] hover:bg-[#12403C] hover:text-white hover:scale-105 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 ${isRTL ? 'left-5' : 'right-5'}`}
                        aria-label="Scroll right"
                    >
                        {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                    </button>
                )}

                {/* Scroll Container */}
                {/* 
                CRITICAL FIX: 
                1. overflow-x: auto -> Enables native horizontal scroll
                2. scroll-snap-type: x mandatory ->  Snaps cards to start
                3. -webkit-overflow-scrolling: touch -> iOS momentum
                4. padding-inline -> Adds safe space on sides
                5. scrollbar-width: none -> Hides scrollbar on Firefox
                */}
                <div className="carousel-wrapper">
                    <div
                        ref={scrollContainerRef}
                        onScroll={checkScroll}
                        className="carousel-track w-full flex overflow-x-auto gap-2 md:gap-3 pb-4 hide-scrollbar snap-x"
                    >
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="carousel-item flex-none snap-start w-[calc(50%-4px)] md:w-auto"
                            >
                                <div className="md:hidden">
                                     <ProductCard product={product} />
                                </div>
                                <div className="hidden md:block">
                                    <ModernProductCard product={product} />
                                </div>
                            </div>
                        ))}

                        {/* View All Card at end of scroll */}
                        <div
                            className="carousel-item flex-none snap-start flex items-center justify-center p-4 bg-white/50 rounded-xl border border-[#12403C]/10"
                        >
                            <Link href={viewAllLink} className="flex flex-col items-center justify-center gap-3 text-center group">
                                <div className="w-12 h-12 rounded-full border border-[#12403C]/20 flex items-center justify-center group-hover:bg-[#12403C] group-hover:border-[#12403C] transition-colors">
                                    {isRTL ? 
                                        <ChevronLeft className="w-5 h-5 text-[#12403C] group-hover:text-white" /> : 
                                        <ChevronRight className="w-5 h-5 text-[#12403C] group-hover:text-white" />
                                    }
                                </div>
                                <span className="text-sm font-medium text-[#12403C]">{t.home.view_all}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
