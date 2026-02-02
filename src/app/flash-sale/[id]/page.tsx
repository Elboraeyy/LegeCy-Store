import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicFlashSaleById } from '@/lib/actions/storefront-promotions';
import { Product } from '@/types/product';
import FlashSalePageClient from '@/app/flash-sale/FlashSalePageClient';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function FlashSalePage({ params }: Props) {
    const { id } = await params;
    const sale = await getPublicFlashSaleById(id);

    if (!sale) {
        notFound();
    }

    // Transform to Product type expected by ProductCard
    const products: Product[] = sale.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.salePrice,
        compareAtPrice: p.originalPrice,
        imageUrl: p.image,
        img: p.image || '/placeholder.jpg',
        inStock: p.inStock,
        isNew: p.isNew,
        description: '', // Not needed for card
        images: [],
        categoryId: '',
        category: '',
        brandId: '',
        brand: '',
        materialId: '',
        material: '',
        createdAt: new Date().toISOString(),
    }));

    return <FlashSalePageClient sale={sale} products={products} />;
}
