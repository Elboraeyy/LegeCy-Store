'use client';

import React, { useEffect, useState } from 'react';
import { fetchFeaturedProducts, ShopProduct } from '@/lib/actions/shop';
import ModernProductCard from '../ModernProductCard';
import { Reveal } from '../ui/Reveal';
import { motion } from 'framer-motion';

export default function CartRecommendations() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Fetch random products or best sellers
                const data = await fetchFeaturedProducts(4);
                setProducts(data);
            } catch (err) {
                console.error("Failed to load recommendations", err);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    if (loading || products.length === 0) return null;

    return (
        <section className="mt-16 pt-12 border-t border-[rgba(18,64,60,0.08)]">
            <div className="flex flex-col md:flex-row items-end justify-between mb-8 gap-4">
                <Reveal>
                    <div>
                        <span className="text-xs font-bold text-[#d4af37] uppercase tracking-[0.2em] mb-2 block">
                            You Might Also Like
                        </span>
                        <h2 className="text-2xl md:text-3xl font-heading text-[#12403C]">
                            Complete Your Look
                        </h2>
                    </div>
                </Reveal>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {products.map((product, idx) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                    >
                        <ModernProductCard product={product} />
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
