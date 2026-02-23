"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useIsClient } from "@/hooks/useIsClient";

export default function NotFound() {
  const { t, language } = useLanguage();
  const isClient = useIsClient();

  const isRTL = language === 'ar';

  if (!isClient) return null;

  const content = t.notFound || {
    title: "Time Has Stopped Here.",
    subtitle: "The page you are looking for seems to have been lost in time.",
    goHome: "Return to Present",
    lostText: "404"
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center bg-[#FCF8F3] px-4 py-12 relative overflow-hidden font-body"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container max-w-2xl mx-auto text-center relative z-10">
        {/* Ghost Background 404 Text - Using Brand Heading Font */}
        <motion.h1
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] md:text-[300px] font-heading font-black text-[#12403C]/5 leading-none select-none pointer-events-none z-[-1]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
        >
          {content.lostText}
        </motion.h1>

        {/* Clock Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative inline-block mb-12"
        >
          {/* Main Clock Face */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-[10px] border-[#12403C] bg-white shadow-2xl flex items-center justify-center relative overflow-hidden">

            {/* Visual Cracks */}
            <div className="absolute top-[15%] left-[25%] h-24 w-[1px] bg-[#12403C]/10 rotate-[20deg]" />
            <div className="absolute top-[45%] left-[65%] h-32 w-[1px] bg-[#12403C]/10 -rotate-[45deg]" />
            <div className="absolute top-[10%] left-[50%] h-16 w-[1px] bg-[#12403C]/5 -rotate-[10deg]" />

            {/* Hour Markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-3 md:h-4 bg-[#12403C]/20"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-140px)`,
                  transformOrigin: "center 140px"
                }}
              />
            ))}

            {/* Hour Hand (Broken Ticking) */}
            <motion.div
              className="absolute w-2 h-20 md:h-24 bg-[#12403C] top-1/2 left-1/2 -translate-x-1/2 rounded-full"
              style={{ transformOrigin: "bottom center", y: "-100%" }}
              animate={{
                rotate: [45, 43, 45],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                repeatType: "loop",
                times: [0, 0.4, 1],
                ease: [1, 0, 0, 1]
              }}
            />

            {/* Minute Hand (Gold Swinging) */}
            <motion.div
              className="absolute w-1 h-28 md:h-36 bg-[#d4af37] top-1/2 left-1/2 -translate-x-1/2 rounded-full"
              style={{ transformOrigin: "bottom center", y: "-100%" }}
              animate={{ rotate: [-15, -25, -15] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            />

            {/* Center Dot */}
            <div className="absolute w-5 h-5 rounded-full bg-[#12403C] z-10 shadow-sm border-2 border-[#FCF8F3]" />
          </div>

          {/* Clock Shadow */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/5 blur-2xl rounded-[100%]" />
        </motion.div>

        {/* Text Content */}
        <div className="relative z-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-3xl md:text-4xl font-heading font-bold text-[#12403C] mb-4 tracking-tight"
          >
            {content.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[#12403C]/60 text-lg md:text-xl mb-12 max-w-md mx-auto font-light leading-relaxed"
          >
            {content.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center px-12 py-4 bg-[#12403C] text-[#FCF8F3] font-bold tracking-[0.15em] uppercase text-[12px] rounded-full overflow-hidden transition-all duration-300 hover:shadow-[0_15px_30px_rgba(18,64,60,0.15)] hover:-translate-y-1"
            >
              <span className="relative z-10 font-body">{content.goHome}</span>
              <div className="absolute inset-0 bg-[#d4af37] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Background Micro-details */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[#12403C]/3 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-80 h-80 bg-[#d4af37]/3 rounded-full blur-3xl" />
      </div>
    </main>
  );
}
