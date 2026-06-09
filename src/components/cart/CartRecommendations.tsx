'use client';

import React, { useEffect, useState } from 'react';
import { fetchRandomProducts, ShopProduct } from '@/lib/actions/shop';
import ProductCarousel from '../ProductCarousel';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';


interface CartRecommendationsProps {
    initialProducts?: ShopProduct[];
}

export default function CartRecommendations({ initialProducts = [] }: CartRecommendationsProps) {
    const [products, setProducts] = useState<ShopProduct[]>(initialProducts);
    const [loading, setLoading] = useState(initialProducts.length === 0);
    const { cart } = useStore();
    const { t } = useLanguage();

    // Get IDs of products currently in the cart
    const cartProductIds = new Set(cart.map(item => item.id));

    useEffect(() => {
        if (initialProducts.length > 0) return;

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
    }, [initialProducts]);

    // Filter out products that are already in the cart
    const filteredProducts = products.filter(p => !cartProductIds.has(p.id));

    if (loading || filteredProducts.length === 0) return null;

    return (
        <section className="mt-16 pt-12 border-t border-[rgba(18,64,60,0.08)] relative px-0 md:px-4">
            <ProductCarousel
                title={t.product.complete_look}
                subtitle={t.product.you_may_also_like}
                products={filteredProducts}
                viewAllLink="/shop"
                customItemClass="!min-w-0 w-[calc(50%-4px)] md:!flex-[0_0_200px] md:!max-w-[200px] md:!w-[200px]" // Shrink card size on desktop
                useContainer={false}
                hideNewBadge={true}
            />
        </section>
    );
}

