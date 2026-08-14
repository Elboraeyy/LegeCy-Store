"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Reveal } from "@/components/ui/Reveal";

export function PackagingSection() {
  const { t, direction } = useLanguage();
  const isRTL = direction === "rtl";

  return (
    <section className="py-16 md:py-24 bg-transparent relative overflow-hidden select-none">


      <div className="container mx-auto px-4 max-w-[1200px] relative z-10">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content Area */}
          <div className="w-full lg:w-[45%] flex flex-col items-center text-center lg:items-start lg:text-left">
            <Reveal delay={0.1}>
              <span className={`text-[#d4af37] text-xs font-bold block mb-3 ${isRTL ? 'text-right' : 'uppercase tracking-[0.2em]'}`}>
                {t.home.packaging_section?.subtitle || "Every Detail Matters"}
              </span>
            </Reveal>

            <Reveal delay={0.2}>
              <h2 className={`text-3xl md:text-5xl font-heading text-[#12403C] mb-6 leading-tight ${isRTL ? 'text-right font-bold' : ''}`}>
                {t.home.packaging_section?.title || "Luxury Unboxing Experience"}
              </h2>
            </Reveal>

            <Reveal delay={0.3}>
              <p className={`text-sm md:text-base text-gray-600 mb-8 leading-relaxed max-w-xl ${isRTL ? 'text-right' : ''}`}>
                {t.home.packaging_section?.description || 
                  "We believe that the unboxing experience should be as premium as the accessory itself. All our pieces are delivered in a signature custom luxury box, making it the perfect gift for yourself or someone special."}
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <Link href="/shop" className="btn btn-primary px-8 py-3 rounded-full hover:scale-105 transition-transform duration-300 !w-fit">
                {t.home.packaging_section?.btn || "Explore Collection"}
              </Link>
            </Reveal>
          </div>

          {/* Cinematic Video Area */}
          <div className="w-full lg:w-[55%]">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative p-1 rounded-2xl bg-gradient-to-tr from-[#d4af37]/30 via-transparent to-[#12403C]/30 shadow-2xl overflow-hidden group"
            >
              {/* Decorative Offset Gold Frame */}
              <div className="absolute inset-0 border border-[#d4af37]/25 rounded-2xl pointer-events-none z-20 transition-transform duration-500 group-hover:scale-[1.01]" />
              
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/5">
                <video 
                  src="https://res.cloudinary.com/dlmjlxygz/video/upload/v1786734486/legacy/videos/packaging_unboxing_video.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  preload="metadata"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                >
                  <source src="https://res.cloudinary.com/dlmjlxygz/video/upload/v1786734486/legacy/videos/packaging_unboxing_video.mp4" type="video/mp4" />
                  <source src="/Packaging/Packaging_compressed.mp4" type="video/mp4" />
                </video>
                
                {/* Subtle Luxury Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none z-10" />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
