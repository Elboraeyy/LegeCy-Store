'use client';

import React, { useEffect, useState } from 'react';
import { fetchFeaturedProducts, ShopProduct } from '@/lib/actions/shop';
import ModernProductCarousel from '../ModernProductCarousel';


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
        <section className="mt-16 pt-12 border-t border-[rgba(18,64,60,0.08)] relative">
            <ModernProductCarousel
                title="Complete Your Look"
                subtitle="You Might Also Like"
                products={products}
                viewAllLink="/shop"
            />
        </section>
    );
}
