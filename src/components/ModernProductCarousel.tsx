"use client";

import React from "react";
import { Product } from "@/types/product";
import ModernProductCard from "./ModernProductCard";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ModernProductCarouselProps {
    products: Product[];
    title: string;
    subtitle?: string;
    viewAllLink?: string;
}

export default function ModernProductCarousel({
    products,
    title,
    subtitle,
    viewAllLink = "/shop"
}: ModernProductCarouselProps) {

    if (!products || products.length === 0) return null;

    return (
        <section className="py-8 bg-transparent">
            <div className="container px-4 mb-6">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                        {subtitle && (
                            <span className="section-subtitle text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em]">
                                {subtitle}
                            </span>
                        )}
                        <h2 className="section-title text-3xl font-heading text-[#12403C]">
                            {title}
                        </h2>
                    </div>
                    {viewAllLink && (
                        <Link href={viewAllLink} className="text-xs font-bold text-[#12403C] border-b border-[#12403C]/30 pb-0.5 flex items-center gap-0.5 hover:text-[#d4af37] transition-colors">
                            VIEW ALL <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                </div>
            </div>

            {/* Scroll Container */}
            {/* 
            CRITICAL FIX: 
            1. overflow-x: auto -> Enables native horizontal scroll
            2. scroll-snap-type: x mandatory ->  Snaps cards to start
            3. -webkit-overflow-scrolling: touch -> iOS momentum
            4. padding-inline -> Adds safe space on sides
            5. scrollbar-width: none -> Hides scrollbar on Firefox
        */}
            <div
                className="flex overflow-x-auto scroll-snap-x-mandatory gap-3 px-4 pb-4 hide-scrollbar snap-x"
                style={{
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="flex-none w-[160px] md:w-[220px] snap-start scroll-ml-4"
                        style={{ scrollSnapAlign: 'start' }}
                    >
                        <ModernProductCard product={product} />
                    </div>
                ))}

                {/* View All Card at end of scroll */}
                <div
                    className="flex-none w-[140px] md:w-[200px] snap-start flex items-center justify-center p-4"
                    style={{ scrollSnapAlign: 'start' }}
                >
                    <Link href={viewAllLink} className="flex flex-col items-center justify-center gap-3 text-center group">
                        <div className="w-12 h-12 rounded-full border border-[#12403C]/20 flex items-center justify-center group-hover:bg-[#12403C] group-hover:border-[#12403C] transition-colors">
                            <ChevronRight className="w-5 h-5 text-[#12403C] group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-[#12403C]">View All Collection</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
