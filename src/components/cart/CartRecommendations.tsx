'use client';

import React, { useEffect, useState } from 'react';
import { fetchRandomProducts, ShopProduct } from '@/lib/actions/shop';
import ModernProductCarousel from '../ModernProductCarousel';


export default function CartRecommendations() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Fetch random products
                const data = await fetchRandomProducts(8);
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
        <section className="mt-16 pt-12 border-t border-[rgba(18,64,60,0.08)] relative px-0 md:px-4">
            <ModernProductCarousel
                title="Complete Your Look"
                subtitle="You Might Also Like"
                products={products}
                viewAllLink="/shop"
                customItemClass="!min-w-0 w-[calc(50%-4px)] md:w-[135px]" // 50% - (gap/2)
                useContainer={false}
                compact={true}
                hideNewBadge={true}
            />
        </section>
    );
}
