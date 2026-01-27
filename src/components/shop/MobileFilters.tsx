"use client";

import React, { useState } from "react";
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

import { useLanguage } from "@/context/LanguageContext";

// Collapsible Section Component
const FilterSection = ({
    title,
    children,
    isOpen,
    onToggle
}: {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}) => {
    return (
        <div className="border-b border-[#12403C]/10 last:border-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 px-5 bg-[#FCF8F3] hover:bg-[#12403C]/5 transition-colors"
            >
                <span className="font-serif text-[#12403C] text-base tracking-wide">{title}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5c6b66]">
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </motion.div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden bg-[#FCF8F3]"
                    >
                        <div className="px-5 pb-5 pt-0">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

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
    const { t } = useLanguage();

    // State for sections (all open by default or selective)
    const [openSections, setOpenSections] = useState({
        categories: true,
        price: true,
        brands: false,
        materials: false,
        status: true
    });

    const toggleSection = (key: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

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

    // Prevent body scroll when open
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
                        className="fixed inset-0 bg-[#12403C]/40 backdrop-blur-[3px] z-[60]"
                    />

                    {/* Bottom Sheet (Slide Up) */}
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
                        className="fixed bottom-0 left-0 right-0 bg-[#FCF8F3] rounded-t-[24px] z-[70] max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                    >
                        {/* Drag Handle */}
                        <div className="pt-3 pb-1 flex justify-center w-full" onClick={onClose}>
                            <div className="w-12 h-1 bg-[#12403C]/10 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#12403C]/10 bg-[#FCF8F3] z-10">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-serif text-[#12403C] tracking-wide">{t.shop.filters}</h2>
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 bg-[#12403C] text-white text-xs font-semibold rounded-full">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-[#5c6b66] hover:bg-[#12403C]/5 hover:text-[#12403C] transition-colors"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto hide-scrollbar overscroll-contain bg-[#FCF8F3] px-1">

                            {/* Categories Section */}
                            <FilterSection
                                title={t.shop.categories.toUpperCase()}
                                isOpen={openSections.categories}
                                onToggle={() => toggleSection('categories')}
                            >
                                <div className="space-y-4 pt-2">
                                    {categories.map((cat) => (
                                        <label
                                            key={cat.id}
                                            className="flex items-center gap-4 cursor-pointer group"
                                        >
                                            <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all duration-200 ${selectedCategories.includes(cat.slug)
                                                ? "bg-[#12403C] border-[#12403C]"
                                                : "bg-white border-[#12403C]/20 group-hover:border-[#12403C]"
                                                }`}>
                                                {selectedCategories.includes(cat.slug) && (
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={selectedCategories.includes(cat.slug)}
                                                onChange={() => handleCategoryToggle(cat.slug)}
                                            />
                                            <span className={`text-[15px] ${selectedCategories.includes(cat.slug) ? "text-[#12403C] font-medium" : "text-[#5c6b66]"
                                                }`}>
                                                {cat.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Price Section */}
                            <FilterSection
                                title={t.shop.price_range.toUpperCase()}
                                isOpen={openSections.price}
                                onToggle={() => toggleSection('price')}
                            >
                                <div className="pt-2 pb-6 px-1">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="flex-1">
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c6b66] text-sm">EGP</span>
                                                <input
                                                    type="number"
                                                    value={priceRange.min}
                                                    onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max) })}
                                                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#12403C]/20 rounded-xl text-[#12403C] font-medium focus:outline-none focus:border-[#12403C] transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-3 h-[1px] bg-[#12403C]/20 flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c6b66] text-sm">EGP</span>
                                                <input
                                                    type="number"
                                                    value={priceRange.max}
                                                    onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min) })}
                                                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#12403C]/20 rounded-xl text-[#12403C] font-medium focus:outline-none focus:border-[#12403C] transition-colors text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slider UI */}
                                    <div className="relative h-1.5 mx-2">
                                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#12403C]/10 rounded-full" />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 h-1 bg-[#12403C] rounded-full"
                                            style={{
                                                left: `${(priceRange.min / maxPrice) * 100}%`,
                                                right: `${100 - (priceRange.max / maxPrice) * 100}%`,
                                            }}
                                        />
                                        <input
                                            type="range"
                                            min={minPrice}
                                            max={maxPrice}
                                            step={50}
                                            value={priceRange.min}
                                            onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max - 50) })}
                                            className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                                            style={{ zIndex: 3 }}
                                        />
                                        <input
                                            type="range"
                                            min={minPrice}
                                            max={maxPrice}
                                            step={50}
                                            value={priceRange.max}
                                            onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min + 50) })}
                                            className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                                            style={{ zIndex: 4 }}
                                        />

                                        {/* Visual Thumbs */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-[#12403C] border-[2px] border-[#FCF8F3] rounded-full shadow-md pointer-events-none z-10"
                                            style={{ left: `calc(${(priceRange.min / maxPrice) * 100}% - 12px)` }}
                                        />
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-[#12403C] border-[2px] border-[#FCF8F3] rounded-full shadow-md pointer-events-none z-10"
                                            style={{ left: `calc(${(priceRange.max / maxPrice) * 100}% - 12px)` }}
                                        />
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Status Section */}
                            <FilterSection
                                title={t.shop.status.toUpperCase()}
                                isOpen={openSections.status}
                                onToggle={() => toggleSection('status')}
                            >
                                <div className="space-y-3 pt-2">
                                    {[
                                        { label: t.shop.new_arrivals, checked: isNew === true, onChange: onNewChange },
                                        { label: t.shop.on_sale, checked: onSale === true, onChange: onSaleChange },
                                        { label: t.shop.in_stock, checked: inStock === true, onChange: onInStockChange },
                                    ].map((item, i) => (
                                        <label key={i} className="flex items-center justify-between group cursor-pointer py-1">
                                            <span className={`text-sm transition-colors ${item.checked ? 'text-[#12403C] font-medium' : 'text-[#5c6b66] group-hover:text-[#12403C]'}`}>
                                                {item.label}
                                            </span>
                                            <div className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${item.checked ? 'bg-[#12403C]' : 'bg-gray-200'}`}>
                                                <div
                                                    className={`bg-white w-4 h-4 rounded-full shadow-sm transform duration-300 ease-in-out ${item.checked ? 'translate-x-4' : 'translate-x-0'}`}
                                                />
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={item.checked}
                                                onChange={() => item.onChange(item.checked ? null : true)}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>

                            {/* Brands Section */}
                            {brands.length > 0 && (
                                <FilterSection
                                    title={t.shop.brands.toUpperCase()}
                                    isOpen={openSections.brands}
                                    onToggle={() => toggleSection('brands')}
                                >
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        {brands.map((brand) => (
                                            <label
                                                key={brand.id}
                                                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-sm cursor-pointer transition-all duration-200 ${selectedBrands.includes(brand.id)
                                                    ? "border-[#12403C] bg-[#12403C] text-white shadow-md shadow-[#12403C]/10 font-medium"
                                                    : "border-[#12403C]/10 bg-white text-[#5c6b66] hover:border-[#12403C]/30"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedBrands.includes(brand.id)}
                                                    onChange={() => handleBrandToggle(brand.id)}
                                                />
                                                {brand.name}
                                            </label>
                                        ))}
                                    </div>
                                </FilterSection>
                            )}

                            {/* Materials Section */}
                            {materials.length > 0 && (
                                <FilterSection
                                    title={t.shop.materials.toUpperCase()}
                                    isOpen={openSections.materials}
                                    onToggle={() => toggleSection('materials')}
                                >
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {materials.map((mat) => (
                                            <label
                                                key={mat.id}
                                                className={`cursor-pointer px-4 py-1.5 rounded-full border text-sm transition-all duration-200 ${selectedMaterials.includes(mat.id)
                                                    ? "border-[#d4af37] bg-[#d4af37]/10 text-[#12403C] font-medium"
                                                    : "border-[#12403C]/10 bg-white text-[#5c6b66] hover:border-[#12403C]/30"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedMaterials.includes(mat.id)}
                                                    onChange={() => handleMaterialToggle(mat.id)}
                                                />
                                                {mat.name}
                                            </label>
                                        ))}
                                    </div>
                                </FilterSection>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-5 bg-[#FCF8F3] border-t border-[#12403C]/10 safe-area-inset-bottom z-20">
                            <div className="flex gap-3">
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        className="px-6 py-3.5 border border-[#12403C]/20 text-[#12403C] rounded-full font-semibold text-xs uppercase tracking-wider hover:bg-[#12403C] hover:text-white transition-colors"
                                    >
                                        {t.shop.clear_all}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3.5 bg-[#12403C] text-white rounded-full font-semibold text-xs uppercase tracking-wider shadow-lg shadow-[#12403C]/20 active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-[#0E3330]"
                                >
                                    {t.shop.show_results}
                                </button>
                            </div>
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
