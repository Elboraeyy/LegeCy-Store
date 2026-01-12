'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import ProductCarousel from '@/components/ProductCarousel';
import { Product } from '@/types/product';

type FlashSale = {
    id: string;
    name: string;
    endDate: Date;
    products: {
        id: string;
        name: string;
        image: string | null;
        originalPrice: number;
        salePrice: number;
    }[];
};

function Countdown({ endDate }: { endDate: Date }) {
    const calculateTimeLeft = useCallback(() => {
        const difference = new Date(endDate).getTime() - new Date().getTime();
        
        if (difference <= 0) {
            return { hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            hours: Math.floor((difference / (1000 * 60 * 60))),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }, [endDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    return (
        <div className="flex gap-2 items-center justify-center">
            <div className="flex flex-col items-center bg-[#F5F0E3] rounded md:rounded-lg px-2.5 py-1 min-w-[44px] md:min-w-[50px]">
                <span className="text-lg md:text-xl font-bold text-[#12403C] leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#4A6B68] leading-none mt-0.5">hrs</span>
            </div>
            <span className="text-lg font-bold text-[#F5F0E3]">:</span>
            <div className="flex flex-col items-center bg-[#F5F0E3] rounded md:rounded-lg px-2.5 py-1 min-w-[44px] md:min-w-[50px]">
                <span className="text-lg md:text-xl font-bold text-[#12403C] leading-none">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#4A6B68] leading-none mt-0.5">min</span>
            </div>
            <span className="text-lg font-bold text-[#F5F0E3]">:</span>
            <div className="flex flex-col items-center bg-[#F5F0E3] rounded md:rounded-lg px-2.5 py-1 min-w-[44px] md:min-w-[50px]">
                <span className="text-lg md:text-xl font-bold text-[#12403C] leading-none">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-wider text-[#4A6B68] leading-none mt-0.5">sec</span>
            </div>
        </div>
    );
}

export function FlashSalesSection({ sales }: { sales: FlashSale[] }) {
    if (!sales || sales.length === 0) return null;

    return (
        <div className="flash-sales-container">
            {sales.map(sale => {
                const carouselProducts: Product[] = sale.products.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.salePrice,
                    compareAtPrice: p.originalPrice,
                    imageUrl: p.image,
                    img: p.image || '/placeholder.jpg'
                }));

                return (

                    <section key={sale.id} className="py-6 bg-[#12403C]">
                        <div className="container mx-auto px-4">
                            <motion.div 
                                className="flex flex-row items-center justify-center gap-6 mb-4"
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4af37] text-[#12403C] rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-black/10">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#12403C] animate-pulse"></span>
                                        Flash Sale
                                    </div>
                                    {/* <h2 className="text-xl md:text-2xl font-heading font-bold text-[#F5F0E3]">{sale.name}</h2> */}
                                </div>
                                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                                    <span className="text-xs text-[#F5F0E3]/80 font-medium uppercase tracking-wide hidden md:inline">Ends in</span>
                                    <Countdown endDate={sale.endDate} />
                                </div>
                            </motion.div>
                            
                            <div className="text-[#F5F0E3]">
                                <ProductCarousel 
                                    products={carouselProducts} 
                                    title={sale.name}
                                    subtitle="LIMITED TIME DEALS"
                                    viewAllLink={`/flash-sale/${sale.id}`}
                                />
                            </div>
                        </div>
                    </section>
                );
            })}
        </div>
    );
}
