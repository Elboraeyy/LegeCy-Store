"use client";

import React, { useState } from "react";

interface FilterSidebarProps {
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
    searchQuery: string;
    onCategoryChange: (categories: string[]) => void;
    onBrandChange: (brands: string[]) => void;
    onMaterialChange: (materials: string[]) => void;
    onPriceChange: (range: { min: number; max: number }) => void;
    onInStockChange: (value: boolean | null) => void;
    onSaleChange: (value: boolean | null) => void;
    onNewChange: (value: boolean | null) => void;
    onSearchChange: (query: string) => void;
    onClearAll: () => void;
    activeFilterCount: number;
}

export default function FilterSidebar({
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
    searchQuery,
    onCategoryChange,
    onBrandChange,
    onMaterialChange,
    onPriceChange,
    onInStockChange,
    onSaleChange,
    onNewChange,
    onSearchChange,
    onClearAll,
    activeFilterCount,
}: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState({
        categories: true,
        price: true,
        brands: true,
        materials: true,
        status: true,
    });

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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

    return (
        <aside className="w-[280px] bg-white rounded-xl border border-gray-100 p-6 h-fit sticky top-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#12403C] font-heading">
                    Filters
                </h2>
                {activeFilterCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-[#d4af37] hover:text-[#12403C] font-medium transition-colors"
                    >
                        Clear All ({activeFilterCount})
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="relative mb-5">
                <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearchChange("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Categories */}
            <FilterSection
                title="Categories"
                isExpanded={expandedSections.categories}
                onToggle={() => toggleSection("categories")}
                count={selectedCategories.length}
            >
                <div className="space-y-2">
                    {categories.map((cat) => (
                        <label
                            key={cat.id}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat.slug)}
                                onChange={() => handleCategoryToggle(cat.slug)}
                                className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                                {cat.name}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Price Range */}
            <FilterSection
                title="Price Range"
                isExpanded={expandedSections.price}
                onToggle={() => toggleSection("price")}
            >
                <div className="space-y-5">
                    {/* Min/Max Inputs */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">EGP</span>
                            <input
                                type="number"
                                value={priceRange.min}
                                onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max) })}
                                min={0}
                                max={3000}
                                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] transition-all"
                            />
                        </div>
                        <div className="text-gray-300 font-light">—</div>
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">EGP</span>
                            <input
                                type="number"
                                value={priceRange.max}
                                onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min) })}
                                min={0}
                                max={3000}
                                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C] transition-all"
                            />
                        </div>
                    </div>

                    {/* Dual Range Slider */}
                    <div className="relative h-5">
                        {/* Track */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                        {/* Active Range */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#12403C] to-[#d4af37] rounded-full transition-all"
                            style={{
                                left: `${(priceRange.min / 3000) * 100}%`,
                                right: `${100 - (priceRange.max / 3000) * 100}%`,
                            }}
                        />
                        {/* Min Slider */}
                        <input
                            type="range"
                            min={0}
                            max={3000}
                            step={50}
                            value={priceRange.min}
                            onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max - 50) })}
                            className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-10
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#12403C] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.15)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#12403C] [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                        />
                        {/* Max Slider */}
                        <input
                            type="range"
                            min={0}
                            max={3000}
                            step={50}
                            value={priceRange.max}
                            onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min + 50) })}
                            className="absolute w-full h-1 top-1/2 -translate-y-1/2 appearance-none bg-transparent pointer-events-none z-20
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d4af37] [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.15)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#d4af37] [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                        />
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                        <span>EGP 0</span>
                        <span>EGP 3,000</span>
                    </div>
                </div>
            </FilterSection>

            {/* Brands */}
            {brands.length > 0 && (
                <FilterSection
                    title="Brands"
                    isExpanded={expandedSections.brands}
                    onToggle={() => toggleSection("brands")}
                    count={selectedBrands.length}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {brands.map((brand) => (
                            <label
                                key={brand.id}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedBrands.includes(brand.id)}
                                    onChange={() => handleBrandToggle(brand.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                                    {brand.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Materials */}
            {materials.length > 0 && (
                <FilterSection
                    title="Materials"
                    isExpanded={expandedSections.materials}
                    onToggle={() => toggleSection("materials")}
                    count={selectedMaterials.length}
                >
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {materials.map((material) => (
                            <label
                                key={material.id}
                                className="flex items-center gap-2 cursor-pointer group"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedMaterials.includes(material.id)}
                                    onChange={() => handleMaterialToggle(material.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                                    {material.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Status Filters */}
            <FilterSection
                title="Status"
                isExpanded={expandedSections.status}
                onToggle={() => toggleSection("status")}
            >
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={inStock === true}
                            onChange={() => onInStockChange(inStock === true ? null : true)}
                            className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                            In Stock
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={onSale === true}
                            onChange={() => onSaleChange(onSale === true ? null : true)}
                            className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                            On Sale
                        </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={isNew === true}
                            onChange={() => onNewChange(isNew === true ? null : true)}
                            className="w-4 h-4 rounded border-gray-300 text-[#12403C] focus:ring-[#d4af37] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-[#12403C] transition-colors">
                            New Arrivals
                        </span>
                    </label>
                </div>
            </FilterSection>
        </aside>
    );
}

function FilterSection({
    title,
    isExpanded,
    onToggle,
    children,
    count,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    count?: number;
}) {
    return (
        <div className="border-b border-gray-100 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
            <button
                onClick={onToggle}
                className="flex items-center justify-between w-full mb-3 group"
            >
                <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {title}
                    {count !== undefined && count > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#d4af37] rounded-full">
                            {count}
                        </span>
                    )}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                        }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && <div>{children}</div>}
        </div>
    );
}
