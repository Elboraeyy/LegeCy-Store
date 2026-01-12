'use client';

import React, { useState, useEffect, useCallback } from 'react';

export function FlashSaleSingleClient({ endDate }: { endDate: Date }) {
    const calculateTimeLeft = useCallback(() => {
        const difference = new Date(endDate).getTime() - new Date().getTime();
        
        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }, [endDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    if (!mounted) return null; // Prevent hydration mismatch

    return (
        <div className="flex flex-wrap gap-3 md:gap-4 items-center justify-center">
            {timeLeft.days > 0 && (
                <>
                    <div className="flex flex-col items-center bg-[#F5F0E3]/10 backdrop-blur-md border border-[#F5F0E3]/20 rounded-lg px-3 py-2 min-w-[60px] md:min-w-[80px]">
                        <span className="text-2xl md:text-3xl font-bold text-[#F5F0E3] tabular-nums">{String(timeLeft.days).padStart(2, '0')}</span>
                        <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#d4af37] mt-0.5 font-medium">Days</span>
                    </div>
                    <span className="text-xl md:text-3xl font-bold text-[#d4af37] hidden md:block">:</span>
                </>
            )}
            
            <div className="flex flex-col items-center bg-[#F5F0E3]/10 backdrop-blur-md border border-[#F5F0E3]/20 rounded-lg px-3 py-2 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-[#F5F0E3] tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#d4af37] mt-0.5 font-medium">Hours</span>
            </div>
            <span className="text-xl md:text-3xl font-bold text-[#d4af37] hidden md:block">:</span>
            
            <div className="flex flex-col items-center bg-[#F5F0E3]/10 backdrop-blur-md border border-[#F5F0E3]/20 rounded-lg px-3 py-2 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-[#F5F0E3] tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#d4af37] mt-0.5 font-medium">Mins</span>
            </div>
            <span className="text-xl md:text-3xl font-bold text-[#d4af37] hidden md:block">:</span>
            
            <div className="flex flex-col items-center bg-[#F5F0E3]/10 backdrop-blur-md border border-[#F5F0E3]/20 rounded-lg px-3 py-2 min-w-[60px] md:min-w-[80px]">
                <span className="text-2xl md:text-3xl font-bold text-[#F5F0E3] tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-[#d4af37] mt-0.5 font-medium">Secs</span>
            </div>
        </div>
    );
}
