"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Reveal } from "@/components/ui/Reveal";

export function PackagingSection() {
  const { t, direction } = useLanguage();
  const isRTL = direction === "rtl";

  return (
    <section className="py-10 md:py-16 relative select-none">
      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        <div className="bg-[#12403C]/[0.03] border border-[#12403C]/[0.08] rounded-3xl p-6 sm:p-8 md:p-12 lg:p-14 shadow-sm">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-16">
            
            {/* Text Content Area */}
            <div className="w-full lg:w-[48%] flex flex-col items-center text-center lg:items-start lg:text-left">
              <Reveal delay={0.05}>
                <span className={`text-[#d4af37] text-xs font-bold block mb-2.5 ${isRTL ? 'text-right' : 'uppercase tracking-[0.2em]'}`}>
                  {t.home.packaging_section?.subtitle || "Every Detail Matters"}
                </span>
              </Reveal>

              <Reveal delay={0.1}>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-heading text-[#12403C] mb-4 leading-snug ${isRTL ? 'text-right font-bold' : ''}`}>
                  {t.home.packaging_section?.title || "Luxury Unboxing Experience"}
                </h2>
              </Reveal>

              <Reveal delay={0.15}>
                <p className={`text-xs sm:text-sm md:text-base text-gray-600 mb-6 leading-relaxed max-w-xl ${isRTL ? 'text-right' : ''}`}>
                  {t.home.packaging_section?.description || 
                    "We believe that the unboxing experience should be as premium as the accessory itself. All our pieces are delivered in a signature custom luxury box, making it the perfect gift for yourself or someone special."}
                </p>
              </Reveal>

              <Reveal delay={0.2}>
                <Link href="/shop" className="btn btn-primary px-7 py-2.5 sm:px-8 sm:py-3 rounded-full hover:scale-105 transition-transform duration-300 !w-fit text-xs sm:text-sm font-medium">
                  {t.home.packaging_section?.btn || "Explore Collection"}
                </Link>
              </Reveal>
            </div>

            {/* Cinematic Video Area */}
            <div className="w-full lg:w-[52%]">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#12403C]/10 bg-[#12403C]/5 group">
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    preload="auto"
                    poster="https://res.cloudinary.com/dlmjlxygz/video/upload/so_0,f_auto,q_auto/v1786734486/legacy/videos/packaging_unboxing_video.jpg"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  >
                    <source src="https://res.cloudinary.com/dlmjlxygz/video/upload/v1786734486/legacy/videos/packaging_unboxing_video.mp4" type="video/mp4" />
                    <source src="/Packaging/Packaging_compressed.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Subtle Luxury Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none z-10" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
