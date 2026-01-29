"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

export default function ComingSoon() {
    const { language } = useLanguage();
    const isArabic = language === 'ar';

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #12403C 0%, #1a5a54 50%, #12403C 100%)',
            }}
        >
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
                {/* Logo */}
                <div className="mb-8">
                    <Image
                        src="/image/legacy-logo.png"
                        alt="Legacy"
                        width={280}
                        height={280}
                        className="w-56 h-56 md:w-72 md:h-72 object-cover rounded-full shadow-2xl"
                        priority
                    />
                </div>

                {/* Brand Name */}
                <h1
                    className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-widest uppercase"
                    style={{ fontFamily: 'var(--font-playfair, Playfair Display, serif)' }}
                >
                    LEGACY
                </h1>

                {/* Divider */}
                <div className="w-24 h-0.5 bg-[#d4af37] mb-8" />

                {/* Coming Soon Text */}
                <h2
                    className="text-2xl md:text-3xl text-[#d4af37] mb-4 font-medium"
                    style={{ fontFamily: isArabic ? 'var(--font-cairo, Cairo, sans-serif)' : 'var(--font-playfair, Playfair Display, serif)' }}
                >
                    {isArabic ? 'قريباً' : 'Coming Soon'}
                </h2>

                {/* Subtitle */}
                <p className="text-white/70 text-base md:text-lg mb-12 leading-relaxed">
                    {isArabic
                        ? 'نعمل على شيء مميز. ترقبونا!'
                        : "We're working on something special. Stay tuned!"
                    }
                </p>

                {/* Decorative Elements */}
                <div className="flex items-center gap-4 text-white/30">
                    <div className="w-8 h-px bg-current" />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <div className="w-8 h-px bg-current" />
                </div>
            </div>

            {/* Bottom Branding */}
            <div className="absolute bottom-8 text-center">
                <p className="text-white/40 text-xs tracking-wider uppercase">
                    {isArabic ? 'ساعات فاخرة' : 'Luxury Timepieces'}
                </p>
            </div>

            {/* Animated Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 animate-pulse"
                style={{
                    background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)',
                }}
            />
        </div>
    );
}
