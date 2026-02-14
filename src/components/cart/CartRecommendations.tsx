'use client';

import React, { useEffect, useState } from 'react';
import { fetchRandomProducts, ShopProduct } from '@/lib/actions/shop';
import ModernProductCarousel from '../ModernProductCarousel';
import { useStore } from '@/context/StoreContext';


export default function CartRecommendations() {
    const [products, setProducts] = useState<ShopProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const { cart } = useStore();

    // Get IDs of products currently in the cart
    const cartProductIds = new Set(cart.map(item => item.id));

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

    // Filter out products that are already in the cart
    const filteredProducts = products.filter(p => !cartProductIds.has(p.id));

    if (loading || filteredProducts.length === 0) return null;

    return (
        <section className="mt-16 pt-12 border-t border-[rgba(18,64,60,0.08)] relative px-0 md:px-4">
            <ModernProductCarousel
                title="Complete Your Look"
                subtitle="You Might Also Like"
                products={filteredProducts}
                viewAllLink="/shop"
                customItemClass="!min-w-0 w-[calc(50%-4px)] md:w-[135px]" // 50% - (gap/2)
                useContainer={false}
                compact={true}
                hideNewBadge={true}
            />
        </section>
    );
}

