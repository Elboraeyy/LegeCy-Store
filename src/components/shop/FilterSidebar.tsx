"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

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
    const { t } = useLanguage();
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
                    {t.shop.filters}
                </h2>
                {activeFilterCount > 0 && (
                    <button
                        onClick={onClearAll}
                        className="text-xs text-[#d4af37] hover:text-[#12403C] font-medium transition-colors"
                    >
                        {t.shop.clear_all} ({activeFilterCount})
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
                    placeholder={t.shop.search_placeholder}
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
                title={t.shop.categories}
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
                title={t.shop.price_range}
                isExpanded={expandedSections.price}
                onToggle={() => toggleSection("price")}
            >
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Min (EGP)</label>
                        <input
                            type="number"
                            value={priceRange.min}
                            onChange={(e) => onPriceChange({ ...priceRange, min: Math.min(Number(e.target.value), priceRange.max) })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C]"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Max (EGP)</label>
                        <input
                            type="number"
                            value={priceRange.max}
                            onChange={(e) => onPriceChange({ ...priceRange, max: Math.max(Number(e.target.value), priceRange.min) })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#12403C] focus:ring-1 focus:ring-[#12403C]"
                        />
                    </div>
                </div>
            </FilterSection>

            {/* Brands */}
            {brands.length > 0 && (
                <FilterSection
                    title={t.shop.brands}
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
                    title={t.shop.materials}
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
                title={t.shop.status}
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
                            {t.shop.in_stock}
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
                            {t.shop.on_sale}
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
                            {t.shop.new_arrivals}
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
