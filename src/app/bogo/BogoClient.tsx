"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

interface BogoDeal {
    id: string;
    name: string;
    type: string;
    buy: number;
    get: number;
    discount?: number;
    products: { image: string | null }[];
}

interface BogoClientProps {
    bogos: BogoDeal[];
}

export default function BogoClient({ bogos }: BogoClientProps) {
    const { t } = useLanguage();

    return (
        <main className="min-h-screen bg-[#FCF8F3] pb-20">
            {/* Header */}
            <div className="bg-[#12403C] pt-32 pb-16 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#FCF8F3] mb-4">
                    {t.home.promotions.buy_one_get_one}
                </h1>
                <p className="text-[#FCF8F3]/80 text-lg max-w-2xl mx-auto">
                    {t.home.promotions.bogo_description}
                </p>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-10">
                {bogos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {bogos.map((deal) => (
                            <Link
                                key={deal.id}
                                href={`/bogo/${deal.id}`}
                                className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#12403C]/5"
                            >
                                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                                    {deal.products[0]?.image ? (
                                        <Image
                                            src={deal.products[0].image}
                                            alt={deal.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">{t.home.promotions.no_image}</div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#12403C] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center px-3 py-1 bg-[#d4af37] text-[#12403C] text-xs font-bold uppercase tracking-wider rounded shadow-lg">
                                            {deal.type === 'BUY_X_GET_Y_FREE'
                                                ? t.home.promotions.free_gift
                                                : t.home.promotions.off_2nd_item.replace('{discount}', String(deal.discount || 0))}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-0 left-0 w-full p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                        <h2 className="text-xl font-heading font-bold mb-1 leading-tight">{deal.name}</h2>
                                        <p className="text-white/80 text-sm">
                                            {t.home.promotions.buy} {deal.buy}, {t.home.promotions.get} {deal.get} {deal.type === 'BUY_X_GET_Y_FREE' ? t.home.promotions.free : t.home.promotions.discounted}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <p className="text-xl text-[#12403C]/60 mb-8">{t.home.promotions.no_active_offers}</p>
                        <Link href="/shop" className="btn btn-primary">
                            {t.common.continue}
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
