'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fadeUpSlow, staggerContainerSlow } from '@/lib/motion';

type Bundle = {
    id: string;
    name: string;
    description: string | null;
    originalPrice: number;
    bundlePrice: number;
    savings: number;
    images: string[];
};

export function BundlesSection({ bundles }: { bundles: Bundle[] }) {
    if (!bundles || bundles.length === 0) return null;

    return (
        <section className="py-20 bg-[#F5F0E3]">
            <div className="container mx-auto px-4">
                <motion.div 
                    className="text-center mb-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUpSlow}
                >
                    <span className="text-[#d4af37] text-xs font-bold tracking-[0.2em] uppercase mb-3 block">Featured Collections</span>
                    <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#12403C]">Curated Sets for You</h2>
                </motion.div>

                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainerSlow}
                >
                    {bundles.map(bundle => (
                        <motion.div 
                            key={bundle.id} 
                            className="group bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                            variants={fadeUpSlow}
                        >
                            <Link href={`/shop/bundle/${bundle.id}`} className="block relative aspect-[4/3] overflow-hidden rounded-lg bg-[#f0f0f0] mb-4 group-hover:opacity-95 transition-opacity">
                                {bundle.images.length > 0 ? (
                                    <div className="grid grid-cols-2 h-full w-full gap-0.5">
                                        {bundle.images.slice(0, 2).map((img, i) => (
                                            <div key={i} className="relative h-full bg-white">
                                                <Image 
                                                    src={img} 
                                                    alt={`${bundle.name} item ${i+1}`}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="relative h-full w-full flex items-center justify-center text-[#4A6B68]/30">
                                        <span className="text-4xl">📦</span>
                                    </div>
                                )}
                                
                                <div className="absolute top-3 left-3 bg-[#12403C] text-[#F5F0E3] text-[10px] font-bold px-2.5 py-1 uppercase tracking-wide rounded-sm">
                                    Save EGP {bundle.savings.toLocaleString()}
                                </div>
                            </Link>

                            <div className="px-1">
                                <h3 className="text-xl font-heading font-bold text-[#12403C] mb-1 group-hover:text-[#d4af37] transition-colors">
                                    <Link href={`/shop/bundle/${bundle.id}`}>{bundle.name}</Link>
                                </h3>
                                <p className="text-[#4A6B68] text-sm mb-4 line-clamp-2 leading-relaxed">{bundle.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-[#4A6B68] line-through mb-0.5">EGP {bundle.originalPrice.toLocaleString()}</span>
                                        <span className="text-lg font-bold text-[#12403C]">EGP {bundle.bundlePrice.toLocaleString()}</span>
                                    </div>
                                    <button className="px-5 py-2.5 bg-[#12403C] text-[#F5F0E3] text-sm font-semibold rounded-lg hover:bg-[#0e3330] transition-colors active:scale-95 duration-200">
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
