"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    categories: { id: string; name: string; slug: string }[];
    brands: { id: string; name: string }[];
    materials: { id: string; name: string }[];
    selectedCategories: string[];
    selectedBrands: string[];
    selectedMaterials: string[];
    priceRange: { min: number; max: number };
    minPrice: number;
    maxPrice: number;
    inStock: boolean | null;
    onSale: boolean | null;
    isNew: boolean | null;
    onCategoryChange: (categories: string[]) => void;
    onBrandChange: (brands: string[]) => void;
    onMaterialChange: (materials: string[]) => void;
    onPriceChange: (range: { min: number; max: number }) => void;
    onInStockChange: (value: boolean | null) => void;
    onSaleChange: (value: boolean | null) => void;
    onNewChange: (value: boolean | null) => void;
    onClearAll: () => void;
    activeFilterCount: number;
}

export default function MobileFilters({
    isOpen,
    onClose,
    categories,
    brands,
    materials,
    selectedCategories,
    selectedBrands,
    selectedMaterials,
    priceRange,
    minPrice,
    maxPrice,
    inStock,
    onSale,
    isNew,
    onCategoryChange,
    onBrandChange,
    onMaterialChange,
    onPriceChange,
    onInStockChange,
    onSaleChange,
    onNewChange,
    onClearAll,
    activeFilterCount,
}: MobileFiltersProps) {
    const handleCategoryToggle = (slug: string) => {
        if (selectedCategories.includes(slug)) {
            onCategoryChange(selectedCategories.filter(c => c !== slug));
        } else {
            onCategoryChange([...selectedCategories, slug]);
        }
    };

    const handleBrandToggle = (id: string) => {
        if (selectedBrands.includes(id)) {
            onBrandChange(selectedBrands.filter(b => b !== id));
        } else {
            onBrandChange([...selectedBrands, id]);
        }
    };

    const handleMaterialToggle = (id: string) => {
        if (selectedMaterials.includes(id)) {
            onMaterialChange(selectedMaterials.filter(m => m !== id));
        } else {
            onMaterialChange([...selectedMaterials, id]);
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.3 }}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100 || info.velocity.y > 300) {
                                onClose();
                            }
                        }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-[70] max-h-[90vh] flex flex-col shadow-2xl"
                    >
                        {/* Drag Handle */}
                        <div className="pt-3 pb-1 flex justify-center">
                            <div className="w-10 h-1 bg-gray-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#12403C] rounded-full flex items-center justify-center">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-[#12403C]">
                                    Filters
                                </h2>
                                {activeFilterCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] text-xs font-bold text-white bg-[#d4af37] rounded-full px-1.5">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                            {/* Categories */}
                            {categories.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                        Categories
                                    </h3>
                                    <div className="space-y-2">
                                        {categories.map((cat) => (
                                            <label
                                                key={cat.id}
                                                className="flex items-center gap-3 cursor-pointer py-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(cat.slug)}
                                                    onChange={() => handleCategoryToggle(cat.slug)}
                                                    className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {cat.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Price Range */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                    Price Range
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">EGP</span>
                                            <input
                                                type="number"
                                                value={priceRange.min}
                                                onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max) })}
                                                min={0}
                                                max={3000}
                                                className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12403C]/20 focus:border-[#12403C] bg-gray-50"
                                            />
                                        </div>
                                        <span className="text-gray-300 font-light">—</span>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">EGP</span>
                                            <input
                                                type="number"
                                                value={priceRange.max}
                                                onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min) })}
                                                min={0}
                                                max={3000}
                                                className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#12403C]/20 focus:border-[#12403C] bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Dual Range Slider */}
                                    <div className="relative h-6">
                                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-gray-200 rounded-full" />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#12403C] to-[#d4af37] rounded-full"
                                            style={{
                                                left: `${(priceRange.min / 3000) * 100}%`,
                                                right: `${100 - (priceRange.max / 3000) * 100}%`,
                                            }}
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={3000}
                                            step={50}
                                            value={priceRange.min}
                                            onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max - 50) })}
                                            className="absolute w-full h-1.5 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-10
                                                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#12403C] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={3000}
                                            step={50}
                                            value={priceRange.max}
                                            onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min + 50) })}
                                            className="absolute w-full h-1.5 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-20
                                                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d4af37] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                                        />
                                    </div>

                                    <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                                        <span>EGP 0</span>
                                        <span>EGP 3,000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Brands */}
                            {brands.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                        Brands
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {brands.map((brand) => (
                                            <label
                                                key={brand.id}
                                                className="flex items-center gap-3 cursor-pointer py-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBrands.includes(brand.id)}
                                                    onChange={() => handleBrandToggle(brand.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {brand.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Materials */}
                            {materials.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                        Materials
                                    </h3>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {materials.map((material) => (
                                            <label
                                                key={material.id}
                                                className="flex items-center gap-3 cursor-pointer py-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMaterials.includes(material.id)}
                                                    onChange={() => handleMaterialToggle(material.id)}
                                                    className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                                />
                                                <span className="text-sm text-gray-700">
                                                    {material.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                                    Status
                                </h3>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={inStock === true}
                                            onChange={() => onInStockChange(inStock === true ? null : true)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                        />
                                        <span className="text-sm text-gray-700">In Stock</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={onSale === true}
                                            onChange={() => onSaleChange(onSale === true ? null : true)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                        />
                                        <span className="text-sm text-gray-700">On Sale</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={isNew === true}
                                            onChange={() => onNewChange(isNew === true ? null : true)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37]"
                                        />
                                        <span className="text-sm text-gray-700">New Arrivals</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 bg-white safe-area-inset-bottom">
                            <div className="flex gap-3">
                                <button
                                    onClick={onClearAll}
                                    className="flex-1 py-3.5 px-4 bg-gray-100 text-[#12403C] rounded-full font-semibold text-sm active:bg-gray-200 transition-all"
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-[2] py-3.5 px-4 bg-[#12403C] text-white rounded-full font-semibold text-sm active:bg-[#0e3330] transition-all shadow-lg shadow-[#12403C]/20"
                                >
                                    Show Results
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
