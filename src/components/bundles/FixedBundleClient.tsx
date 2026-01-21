'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { addBundleToCartAction } from '@/lib/actions/cart';

interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    variants: { id: string; price: number }[];
}

interface BundleProduct {
    id: string;
    quantity: number;
    product: Product;
}

interface Bundle {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    originalPrice: number;
    bundlePrice: number;
    savings: number;
    products: BundleProduct[];
}

type Props = {
    bundle: Bundle;
};

export function FixedBundleClient({ bundle }: Props) {
    const [isPending, startTransition] = useTransition();
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Collect all unique images from products
    // Bundle object structure from getPublicBundleBySlug
    const allImages = React.useMemo(() => {
        const images: string[] = [];
        bundle.products.forEach((p) => {
            if (p.product.imageUrl) images.push(p.product.imageUrl);
        });
        return images.length > 0 ? images : ['/placeholder.jpg'];
    }, [bundle]);

    const handleAddToCart = () => {
        startTransition(async () => {
            try {
                // Prepare items payload
                const itemsToAdd = bundle.products.map((p) => {
                    // For fixed bundles, we assume default variant (first one)
                    // In a real robust system, we might ask user to select size for each item if applicable.
                    // For now, taking the first variant.
                    const defaultVariant = p.product.variants[0];
                    if (!defaultVariant) throw new Error(`Product ${p.product.name} has no variants.`);
                    
                    return {
                        productId: p.product.id,
                        variantId: defaultVariant.id,
                        qty: p.quantity
                    };
                });

                await addBundleToCartAction(bundle.id, itemsToAdd);
                toast.success('Bundle added to cart!', {
                    description: `You saved EGP ${bundle.savings} on this deal.`
                });
            } catch (error) {
                console.error(error);
                toast.error('Failed to add bundle', {
                    description: (error instanceof Error ? error.message : "Something went wrong.")
                });
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                {/* Left: Image Gallery */}
                <div className="space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-[#12403C]/10"
                    >
                         <Image
                            src={allImages[activeImageIndex]}
                            alt={bundle.name}
                            fill
                            className="object-cover"
                            priority
                        />
                         {/* Savings Badge */}
                        <div className="absolute top-6 right-6 z-10">
                            <span className="bg-[#d4af37] text-[#12403C] px-4 py-2 font-bold uppercase tracking-wider rounded-full shadow-lg">
                                Save EGP {bundle.savings}
                            </span>
                        </div>
                    </motion.div>

                    {allImages.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {allImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                                        activeImageIndex === idx ? 'border-[#12403C]' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                     <Image
                                        src={img}
                                        alt={`Thumbnail ${idx}`}
                                        fill
                                        className="object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Bundle Details */}
                <div className="flex flex-col h-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-widest text-xs mb-3">
                            <Package className="w-4 h-4" />
                            <span>Exclusive Bundle</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-heading font-bold text-[#12403C] mb-4">
                            {bundle.name}
                        </h1>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            {bundle.description}
                        </p>
                    </div>

                    {/* Included Products List */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8 shadow-sm">
                        <h3 className="text-[#12403C] font-bold mb-4 uppercase text-sm tracking-wider">Included in this set:</h3>
                        <div className="space-y-4">
                            {bundle.products.map((p) => (
                                <div key={p.id} className="flex items-center gap-4 group">
                                    <div className="relative w-16 h-16 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                                         {p.product.imageUrl && (
                                            <Image
                                                src={p.product.imageUrl}
                                                alt={p.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                         )}
                                    </div>
                                    <div className="flex-1">
                                        <Link href={`/product/${p.product.id}`} className="font-bold text-[#12403C] group-hover:text-[#d4af37] transition-colors">
                                            {p.product.name}
                                        </Link>
                                        <div className="text-sm text-gray-500">
                                            Qty: {p.quantity} &times; <span className="line-through">EGP {p.product.price}</span>
                                        </div>
                                    </div>
                                    <div className="text-[#12403C] font-bold">
                                        <Check className="w-5 h-5 text-green-600" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-auto bg-[#FCF8F3]/30 p-8 rounded-2xl border border-[#d4af37]/20">
                        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-6">
                            <div>
                                <span className="block text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">Total Value</span>
                                <span className="text-2xl text-gray-400 line-through">EGP {bundle.originalPrice}</span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[#12403C] text-sm font-bold uppercase tracking-wider mb-1">Bundle Price</span>
                                <span className="text-4xl md:text-5xl font-bold text-[#12403C]">EGP {bundle.bundlePrice}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isPending}
                            className="w-full py-5 bg-[#12403C] text-[#FCF8F3] font-bold uppercase tracking-widest text-lg rounded-xl hover:bg-[#d4af37] hover:text-[#12403C] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <span className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Add Bundle to Cart <ShoppingCart className="w-5 h-5" />
                                </>
                            )}
                        </button>
                         <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
                            <AlertCircle className="w-3 h-3" />
                            Limited time offer. Returns are processed for the entire bundle.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
