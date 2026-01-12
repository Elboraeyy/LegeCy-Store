import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPublicFlashSaleById } from '@/lib/actions/storefront-promotions';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import { FlashSaleSingleClient } from '@/components/flash-sale/FlashSaleSingleClient';

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
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    return (
        <main className="min-h-screen bg-[#F5F0E3]">
            {/* Hero Header */}
            {/* Hero Header */}
            <div className="bg-[#12403C] min-h-[30vh] md:min-h-[40vh] flex flex-col justify-center items-center pt-16 pb-8 md:pt-24 md:pb-12 text-center px-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[200%] bg-[radial-gradient(circle,rgba(212,175,55,0.15)_0%,transparent_70%)]"></div>
                </div>
                
                <div className="container mx-auto relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#d4af37] text-[#12403C] rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-lg mb-3 animate-fade-in-up">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#12403C] animate-pulse"></span>
                        Flash Sale Event
                    </div>
                    
                    <h1 className="text-2xl md:text-4xl font-heading font-bold text-[#F5F0E3] mb-3 animate-fade-in-up delay-100">
                        {sale.name}
                    </h1>
                    
                    {sale.description && (
                        <p className="text-[#F5F0E3]/80 max-w-2xl mx-auto text-sm md:text-base mb-4 animate-fade-in-up delay-200">
                            {sale.description}
                        </p>
                    )}

                    <div className="animate-fade-in-up delay-300">
                         <FlashSaleSingleClient endDate={sale.endDate} />
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                    {products.map((product) => (
                        <div key={product.id} className="animate-fade-in-up">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
                
                {products.length === 0 && (
                    <div className="text-center py-20 text-[#4A6B68]">
                        <p className="text-xl">All products in this flash sale have been sold out.</p>
                        <Link href="/shop" className="text-[#12403C] underline mt-4 inline-block">
                            Browse other collections
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
