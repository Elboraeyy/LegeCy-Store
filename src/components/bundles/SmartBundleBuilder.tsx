'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Image from 'next/image';
import { ShoppingCart, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { addBundleToCartAction } from '@/lib/actions/cart';

// Product Interface
interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    variants: { id: string; price: number }[];
}

// Bundle Group Option Interface
interface GroupOption {
    id: string;
    productId: string;
    additionalPrice: number;
    product: Product;
}

// Bundle Group Interface
interface BundleGroup {
    id: string;
    name: string;
    sortOrder: number;
    options: GroupOption[];
}

// Bundle Interface
interface Bundle {
    id: string;
    name: string;
    description: string | null;
    bundlePrice: number;
    originalPrice: number;
    groups: BundleGroup[];
}

type Props = {
    bundle: Bundle;
};

// Selection State: Record<GroupId, { productId, variantId, additionalPrice }>
type Selections = Record<string, {
    productId: string;
    variantId: string;
    productName: string;
    imageUrl: string;
    additionalPrice: number;
}>;

export function SmartBundleBuilder({ bundle }: Props) {
    const [isPending, startTransition] = useTransition();
    const [selections, setSelections] = useState<Selections>({});
    
    // Sort groups by sortOrder
    const sortedGroups = useMemo(() => {
        return [...bundle.groups].sort((a, b) => a.sortOrder - b.sortOrder);
    }, [bundle.groups]);

    // Calculate Dynamic Price
    const { totalPrice, originalTotal, savings } = useMemo(() => {
        // "Bundle Price" is Base Bundle Price + Sum of Additional Costs.
        
        let selectedOriginalSum = 0;
        let additionalCostSum = 0;

        sortedGroups.forEach(group => {
            const sel = selections[group.id];
            if (sel) {
                 const groupOption = group.options.find((o) => o.productId === sel.productId);
                 const originalItemPrice = groupOption?.product?.price || 0;
                 
                 selectedOriginalSum += originalItemPrice;
                 additionalCostSum += sel.additionalPrice;
            }
        });

        return {
            totalPrice: bundle.bundlePrice + additionalCostSum,
            originalTotal: selectedOriginalSum > 0 ? selectedOriginalSum : bundle.originalPrice,
            savings: selectedOriginalSum > 0 ? (selectedOriginalSum - (bundle.bundlePrice + additionalCostSum)) : 0
        };
    }, [bundle, selections, sortedGroups]);

    // Validation
    const isComplete = sortedGroups.every(g => selections[g.id]);

    const handleSelect = (groupId: string, option: GroupOption) => {
        // Auto-select first variant if multiple, or expand UI?
        // For simplicity, taking first variant. 
        const variant = option.product.variants[0];
        if (!variant) return;

        setSelections(prev => ({
            ...prev,
            [groupId]: {
                productId: option.productId,
                variantId: variant.id,
                productName: option.product.name,
                imageUrl: option.product.imageUrl || '',
                additionalPrice: option.additionalPrice
            }
        }));
    };

    const handleAddToCart = () => {
        if (!isComplete) return;

        startTransition(async () => {
            try {
                const itemsToAdd = Object.values(selections).map(sel => ({
                    productId: sel.productId,
                    variantId: sel.variantId,
                    qty: 1
                }));

                await addBundleToCartAction(bundle.id, itemsToAdd);
                toast.success('Custom bundle added to cart!', {
                    description: 'Your mix & match creation is ready.'
                });
            } catch (error) {
                console.error(error);
                toast.error('Failed to add bundle', { description: error instanceof Error ? error.message : "Unknown error" });
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-16">
            <div className="flex flex-col lg:flex-row gap-12 relative">
                
                {/* Left: Builder Panel */}
                <div className="flex-1 space-y-12 pb-32 lg:pb-0">
                    <div>
                        <div className="flex items-center gap-2 text-[#d4af37] font-bold uppercase tracking-widest text-xs mb-3">
                            <Package className="w-4 h-4" />
                            <span>Mix & Match Bundle</span>
                        </div>
                        <h1 className="text-4xl font-heading font-bold text-[#12403C] mb-4">
                            {bundle.name}
                        </h1>
                         <p className="text-gray-600">
                            {bundle.description || "Customize your perfect set. Select an option from each group below."}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {sortedGroups.map((group, index) => {
                            const selected = selections[group.id];
                            return (
                                <div key={group.id} className={`bg-white rounded-2xl border transition-all duration-300 ${selected ? 'border-[#12403C] shadow-md' : 'border-gray-200'}`}>
                                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
                                        <div>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {index + 1}</span>
                                            <h3 className="text-xl font-bold text-[#12403C] mt-1">{group.name}</h3>
                                        </div>
                                        {selected && (
                                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                <Check className="w-3 h-3" /> Selected
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {group.options.map((option) => {
                                                const isSelected = selected?.productId === option.productId;
                                                return (
                                                    <div 
                                                        key={option.id}
                                                        onClick={() => handleSelect(group.id, option)}
                                                        className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                            isSelected 
                                                                ? 'border-[#12403C] bg-[#12403C]/5' 
                                                                : 'border-transparent bg-gray-50 hover:bg-gray-100 hover:border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                                            {option.product.imageUrl && (
                                                                <Image 
                                                                    src={option.product.imageUrl} 
                                                                    alt={option.product.name} 
                                                                    fill 
                                                                    className="object-cover" 
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className={`font-bold text-sm ${isSelected ? 'text-[#12403C]' : 'text-gray-700'}`}>
                                                                {option.product.name}
                                                            </h4>
                                                            {option.additionalPrice > 0 && (
                                                                <span className="text-xs text-[#d4af37] font-bold">
                                                                    + EGP {option.additionalPrice}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 bg-[#12403C] rounded-full flex items-center justify-center text-white">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right/Bottom: Sticky Summary */}
                <div className="fixed bottom-0 left-0 w-full lg:static lg:w-[400px] z-40 lg:z-auto">
                    <div className="bg-white border-t lg:border border-gray-200 lg:rounded-2xl lg:shadow-xl p-6 lg:p-8 lg:sticky lg:top-32">
                        <h3 className="text-xl font-bold text-[#12403C] mb-6 hidden lg:block">Your Bundle</h3>
                        
                        {/* Selected Items Summary (Desktop) */}
                        <div className="space-y-4 mb-6 hidden lg:block">
                            {sortedGroups.map((group) => {
                                const sel = selections[group.id];
                                return (
                                    <div key={group.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">{group.name}:</span>
                                        <span className="font-medium text-[#12403C] truncate max-w-[150px] text-right">
                                            {sel ? sel.productName : '---'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <span className="text-sm text-gray-400 line-through">EGP {originalTotal}</span>
                                <div className="text-3xl font-bold text-[#12403C]">EGP {totalPrice}</div>
                            </div>
                            {savings > 0 && (
                                <span className="px-3 py-1 bg-[#d4af37]/10 text-[#d4af37] text-xs font-bold uppercase rounded-full">
                                    Save EGP {savings}
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={!isComplete || isPending}
                            className="w-full py-4 bg-[#12403C] text-[#F5F0E3] font-bold uppercase tracking-widest text-sm md:text-base rounded-xl hover:bg-[#d4af37] hover:text-[#12403C] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                             {isPending ? (
                                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Add Bundle to Cart <ShoppingCart className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        
                        {!isComplete && (
                            <p className="text-center text-xs text-red-500 mt-3 hidden lg:block">
                                * Please complete all selections
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
