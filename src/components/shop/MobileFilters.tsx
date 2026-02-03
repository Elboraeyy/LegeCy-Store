"use client";

import React, { useState, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PriceRangeSlider from "./PriceRangeSlider";

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
                aria-expanded={isOpen}
                aria-controls={`filter-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
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
                        id={`filter-section-${title.toLowerCase().replace(/\s+/g, '-')}`}
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

const MobileFilters = memo(function MobileFilters({
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
        brands: true,
        materials: true,
        status: true
    });

    const toggleSection = useCallback((key: keyof typeof openSections) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const handleCategoryToggle = useCallback((slug: string) => {
        if (selectedCategories.includes(slug)) {
            onCategoryChange(selectedCategories.filter(c => c !== slug));
        } else {
            onCategoryChange([...selectedCategories, slug]);
        }
    }, [selectedCategories, onCategoryChange]);

    const handleBrandToggle = useCallback((id: string) => {
        if (selectedBrands.includes(id)) {
            onBrandChange(selectedBrands.filter(b => b !== id));
        } else {
            onBrandChange([...selectedBrands, id]);
        }
    }, [selectedBrands, onBrandChange]);

    const handleMaterialToggle = useCallback((id: string) => {
        if (selectedMaterials.includes(id)) {
            onMaterialChange(selectedMaterials.filter(m => m !== id));
        } else {
            onMaterialChange([...selectedMaterials, id]);
        }
    }, [selectedMaterials, onMaterialChange]);

    // Prevent body scroll when open
    React.useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
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
                        transition={{ type: "tween", duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
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
                        <div
                            className="pt-3 pb-1 flex justify-center w-full cursor-grab active:cursor-grabbing"
                            onClick={onClose}
                            role="button"
                            aria-label="Close filters"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onClose();
                                }
                            }}
                        >
                            <div className="w-12 h-1 bg-[#12403C]/10 rounded-full" aria-hidden="true" />
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
                                aria-label="Close filters"
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
                                                aria-label={`${t.shop.categories || 'Category'}: ${cat.name}`}
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
                                <div className="space-y-5 pt-2 pb-6 px-1">
                                    {/* Range Slider */}
                                    <PriceRangeSlider
                                        min={minPrice}
                                        max={maxPrice}
                                        value={priceRange}
                                        onChange={onPriceChange}
                                    />

                                    {/* Number Inputs */}
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs text-[#5c6b66] mb-1.5 block font-medium">Min</label>
                                            <input
                                                type="number"
                                                value={priceRange.min}
                                                min={minPrice}
                                                max={maxPrice}
                                                onChange={(e) => {
                                                    const value = Math.max(minPrice, Math.min(maxPrice, Number(e.target.value) || minPrice));
                                                    onPriceChange({ ...priceRange, min: Math.min(value, priceRange.max) });
                                                }}
                                                aria-label="Minimum price"
                                                className="w-full px-4 py-3 bg-white border border-[#12403C]/20 rounded-xl text-[#12403C] font-medium focus:outline-none focus:border-[#12403C] focus:ring-2 focus:ring-[#12403C]/10 transition-all text-sm"
                                            />
                                        </div>
                                        <div className="pb-2.5 text-[#5c6b66]">-</div>
                                        <div className="flex-1">
                                            <label className="text-xs text-[#5c6b66] mb-1.5 block font-medium">Max</label>
                                            <input
                                                type="number"
                                                value={priceRange.max}
                                                min={minPrice}
                                                max={maxPrice}
                                                onChange={(e) => {
                                                    const value = Math.max(minPrice, Math.min(maxPrice, Number(e.target.value) || maxPrice));
                                                    onPriceChange({ ...priceRange, max: Math.max(value, priceRange.min) });
                                                }}
                                                aria-label="Maximum price"
                                                className="w-full px-4 py-3 bg-white border border-[#12403C]/20 rounded-xl text-[#12403C] font-medium focus:outline-none focus:border-[#12403C] focus:ring-2 focus:ring-[#12403C]/10 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </FilterSection>

                            {/* Brands Section */}
                            {brands.length > 0 && (
                                <FilterSection
                                    title={t.shop.brands.toUpperCase()}
                                    isOpen={openSections.brands}
                                    onToggle={() => toggleSection('brands')}
                                >
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {brands.map((brand) => (
                                            <label
                                                key={brand.id}
                                                className={`cursor-pointer px-4 py-2 rounded-lg border text-sm transition-all duration-200 ${selectedBrands.includes(brand.id)
                                                    ? "border-[#12403C] bg-[#12403C] text-white shadow-sm font-medium"
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
                                                aria-label={item.label}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-5 bg-[#FCF8F3] border-t border-[#12403C]/10 safe-area-inset-bottom z-20">
                            <div className="flex gap-3">
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={onClearAll}
                                        aria-label={`${t.shop.clear_all || 'Clear all'} ${activeFilterCount} ${t.shop.filters || 'filters'}`}
                                        className="px-6 py-3.5 border border-[#12403C]/20 text-[#12403C] rounded-full font-semibold text-xs uppercase tracking-wider hover:bg-[#12403C] hover:text-white transition-colors"
                                    >
                                        {t.shop.clear_all}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label={t.shop.show_results || "Show results"}
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
});

MobileFilters.displayName = 'MobileFilters';

export default MobileFilters;
