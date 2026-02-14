"use client";

import React, { useState, useMemo, useTransition, useDeferredValue, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/shop/FilterSidebar";
import MobileFilters from "@/components/shop/MobileFilters";
import ProductGrid from "@/components/shop/ProductGrid";
import SortDropdown from "@/components/shop/SortDropdown";
import ActiveFilters from "@/components/shop/ActiveFilters";
import { Product } from "@/types/product";
import { useLanguage } from "@/context/LanguageContext";
import { useIsClient } from "@/hooks/useIsClient";

interface ShopClientProps {
    initialProducts?: Product[];
    categories?: { id: string; name: string; nameAr?: string | null; slug: string }[];
    brands?: { id: string; name: string }[];
    materials?: { id: string; name: string }[];
}

export default function ShopClient({
    initialProducts = [],
    categories = [],
    brands = [],
    materials = [],
}: ShopClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();
    const [isPending] = useTransition();

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list" | "compact" | "categories">("categories");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Fixed price bounds (0-3000)
    const absoluteMinPrice = 0;
    const absoluteMaxPrice = 3000;

    // State - Local state for instant filtering
    const [filters, setFilters] = useState({
        selectedCategories: searchParams.get("category")?.split(",").filter(Boolean) || [],
        selectedBrands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
        selectedMaterials: searchParams.get("materials")?.split(",").filter(Boolean) || [],
        sortBy: searchParams.get("sort") || "featured",
        searchQuery: searchParams.get("q") || "",
        minPrice: Number(searchParams.get("minPrice")) || absoluteMinPrice,
        maxPrice: Number(searchParams.get("maxPrice")) || absoluteMaxPrice,
        inStock: searchParams.get("inStock") === "true" ? true : searchParams.get("inStock") === "false" ? false : null,
        onSale: searchParams.get("onSale") === "true" ? true : null,
        isNew: searchParams.get("new") === "true" ? true : null,
    });

    // Update local state when searchParams change (e.g. browser back button)
    React.useEffect(() => {
        setFilters({
            selectedCategories: searchParams.get("category")?.split(",").filter(Boolean) || [],
            selectedBrands: searchParams.get("brands")?.split(",").filter(Boolean) || [],
            selectedMaterials: searchParams.get("materials")?.split(",").filter(Boolean) || [],
            sortBy: searchParams.get("sort") || "featured",
            searchQuery: searchParams.get("q") || "",
            minPrice: Number(searchParams.get("minPrice")) || absoluteMinPrice,
            maxPrice: Number(searchParams.get("maxPrice")) || absoluteMaxPrice,
            inStock: searchParams.get("inStock") === "true" ? true : searchParams.get("inStock") === "false" ? false : null,
            onSale: searchParams.get("onSale") === "true" ? true : null,
            isNew: searchParams.get("new") === "true" ? true : null,
        });
        setCurrentPage(1);
    }, [searchParams, absoluteMinPrice, absoluteMaxPrice]);

    // Update URL asynchronously with a small debounce to avoid history flooding
    React.useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams();

            if (filters.selectedCategories.length > 0) {
                params.set("category", filters.selectedCategories.join(","));
            }
            if (filters.selectedBrands.length > 0) {
                params.set("brands", filters.selectedBrands.join(","));
            }
            if (filters.selectedMaterials.length > 0) {
                params.set("materials", filters.selectedMaterials.join(","));
            }
            if (filters.searchQuery) {
                params.set("q", filters.searchQuery);
            }
            if (filters.sortBy !== "featured") {
                params.set("sort", filters.sortBy);
            }
            if (filters.minPrice > absoluteMinPrice) {
                params.set("minPrice", String(filters.minPrice));
            }
            if (filters.maxPrice < absoluteMaxPrice) {
                params.set("maxPrice", String(filters.maxPrice));
            }
            if (filters.inStock !== null) {
                params.set("inStock", String(filters.inStock));
            }
            if (filters.onSale === true) {
                params.set("onSale", "true");
            }
            if (filters.isNew === true) {
                params.set("new", "true");
            }

            const url = params.toString() ? `/shop?${params.toString()}` : "/shop";

            // Only replace if the URL actually changed to avoid unnecessary re-renders
            const currentUrl = window.location.pathname + window.location.search;
            if (url !== currentUrl) {
                router.replace(url, { scroll: false });
            }
        }, 400); // 400ms debounce

        return () => clearTimeout(timer);
    }, [filters, router, absoluteMinPrice, absoluteMaxPrice]);

    // Deferred search query for smoother typing experience
    const deferredSearchQuery = useDeferredValue(filters.searchQuery);

    // Update local state immediately
    const updateFilters = useCallback((updates: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...updates }));
        setCurrentPage(1);
    }, []);

    // Stable randomization for "Featured" view
    // Using isClient to avoid hydration mismatch during SSR
    const isClient = useIsClient();
    const randomizedInitialProducts = useMemo(() => {
        if (!isClient) return initialProducts;
        return [...initialProducts].sort(() => Math.random() - 0.5);
    }, [initialProducts, isClient]);

    // CLIENT-SIDE FILTERING LOGIC - Optimized for instant filtering
    // Use deferred search query for smoother typing
    const filteredProducts = useMemo(() => {
        let result = [...randomizedInitialProducts];

        // 1. Search Query (using deferred value for smoother typing)
        if (deferredSearchQuery) {
            const query = deferredSearchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query)) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
                (p.brandName && p.brandName.toLowerCase().includes(query)) ||
                (p.categoryName && p.categoryName.toLowerCase().includes(query))
            );
        }

        // 2. Category Filter (by Slug)
        if (filters.selectedCategories.length > 0) {
            result = result.filter(p => p.categorySlug && filters.selectedCategories.includes(p.categorySlug));
        }

        // 3. Brand Filter (by ID)
        if (filters.selectedBrands.length > 0) {
            result = result.filter(p => p.brandId && filters.selectedBrands.includes(p.brandId));
        }

        // 4. Material Filter (by ID)
        if (filters.selectedMaterials.length > 0) {
            result = result.filter(p => p.materialId && filters.selectedMaterials.includes(p.materialId));
        }

        // 5. Price Filter
        if (filters.minPrice > absoluteMinPrice || filters.maxPrice < absoluteMaxPrice) {
            result = result.filter(p => p.price >= filters.minPrice && p.price <= filters.maxPrice);
        }

        // 6. In Stock Filter
        if (filters.inStock === true) {
            result = result.filter(p => p.inStock === true);
        } else if (filters.inStock === false) {
            result = result.filter(p => !p.inStock);
        }

        // 7. On Sale Filter
        if (filters.onSale) {
            result = result.filter(p => p.compareAtPrice && p.compareAtPrice > p.price);
        }

        // 8. New Arrivals Filter
        if (filters.isNew) {
            result = result.filter(p => p.isNew);
        }

        return result;
    }, [
        randomizedInitialProducts,
        deferredSearchQuery,
        filters.selectedCategories,
        filters.selectedBrands,
        filters.selectedMaterials,
        filters.minPrice,
        filters.maxPrice,
        filters.inStock,
        filters.onSale,
        filters.isNew,
        absoluteMinPrice,
        absoluteMaxPrice
    ]);

    // Apply Sorting to the Filtered Results
    const filteredAndSortedProducts = useMemo(() => {
        const result = [...filteredProducts];

        switch (filters.sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                break;
            case "price-asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price-desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "name-asc":
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                // Featured layout logic - keep original order
                break;
        }

        return result;
    }, [filteredProducts, filters.sortBy]);

    // Pagination - Memoized for performance
    const totalPages = useMemo(() => Math.ceil(filteredAndSortedProducts.length / itemsPerPage), [filteredAndSortedProducts.length, itemsPerPage]);
    const paginatedProducts = useMemo(() => filteredAndSortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ), [filteredAndSortedProducts, currentPage, itemsPerPage]);

    // Active filters
    const activeFilters = useMemo(() => {
        const active: Array<{ type: string; value: string; label: string }> = [];

        filters.selectedCategories.forEach(slug => {
            const cat = categories.find(c => c.slug === slug);
            if (cat) active.push({ type: "category", value: slug, label: cat.name });
        });

        filters.selectedBrands.forEach(id => {
            const brand = brands.find(b => b.id === id);
            if (brand) active.push({ type: "brand", value: id, label: brand.name });
        });

        filters.selectedMaterials.forEach(id => {
            const material = materials.find(m => m.id === id);
            if (material) active.push({ type: "material", value: id, label: material.name });
        });

        if (filters.minPrice > absoluteMinPrice || filters.maxPrice < absoluteMaxPrice) {
            active.push({
                type: "price",
                value: "price",
                label: `EGP ${filters.minPrice.toLocaleString()} - ${filters.maxPrice.toLocaleString()}`,
            });
        }

        if (filters.inStock === true) active.push({ type: "inStock", value: "true", label: t.shop.in_stock });
        if (filters.onSale === true) active.push({ type: "onSale", value: "true", label: t.shop.on_sale });
        if (filters.isNew === true) active.push({ type: "new", value: "true", label: t.shop.new_arrivals });

        return active;
    }, [filters, categories, brands, materials, absoluteMinPrice, absoluteMaxPrice, t.shop.in_stock, t.shop.new_arrivals, t.shop.on_sale]);

    const handleRemoveFilter = (filter: { type: string; value: string }) => {
        switch (filter.type) {
            case "category":
                updateFilters({ selectedCategories: filters.selectedCategories.filter(c => c !== filter.value) });
                break;
            case "brand":
                updateFilters({ selectedBrands: filters.selectedBrands.filter(b => b !== filter.value) });
                break;
            case "material":
                updateFilters({ selectedMaterials: filters.selectedMaterials.filter(m => m !== filter.value) });
                break;
            case "price":
                updateFilters({ minPrice: absoluteMinPrice, maxPrice: absoluteMaxPrice });
                break;
            case "inStock":
                updateFilters({ inStock: null });
                break;
            case "onSale":
                updateFilters({ onSale: null });
                break;
            case "new":
                updateFilters({ isNew: null });
                break;
        }
    };

    const handleClearAll = () => {
        updateFilters({
            selectedCategories: [],
            selectedBrands: [],
            selectedMaterials: [],
            searchQuery: "",
            sortBy: "featured",
            minPrice: absoluteMinPrice,
            maxPrice: absoluteMaxPrice,
            inStock: null,
            onSale: null,
            isNew: null,
        });
    };

    return (
        <div className="min-h-screen bg-[#FCF8F3]">
            {/* Hero Section - Mobile Optimized */}
            <div className="bg-gradient-to-br from-[#12403C] to-[#0E3330] text-center py-8 md:py-12 mb-4 md:mb-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-normal mb-1 md:mb-2 text-[#FCF8F3] tracking-wide">
                        {t.shop.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#FCF8F3]/70 max-w-xl mx-auto">
                        {t.shop.subtitle}
                    </p>
                </div>
            </div>

            {/* Mobile Search Bar */}
            <div className="lg:hidden px-4 mb-4">
                <div className="relative">
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={(e) => updateFilters({ searchQuery: e.target.value })}
                        placeholder={t.shop.search_placeholder}
                        className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#12403C] focus:ring-2 focus:ring-[#12403C]/10 shadow-sm transition-all placeholder:text-gray-400"
                    />
                    {filters.searchQuery && (
                        <button
                            onClick={() => updateFilters({ searchQuery: "" })}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 pb-20 md:pb-16 hidden md:block">
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block flex-shrink-0">
                        <FilterSidebar
                            categories={categories}
                            brands={brands}
                            materials={materials}
                            selectedCategories={filters.selectedCategories}
                            selectedBrands={filters.selectedBrands}
                            selectedMaterials={filters.selectedMaterials}
                            priceRange={{ min: filters.minPrice, max: filters.maxPrice }}
                            minPrice={absoluteMinPrice}
                            maxPrice={absoluteMaxPrice}
                            inStock={filters.inStock}
                            onSale={filters.onSale}
                            isNew={filters.isNew}
                            searchQuery={filters.searchQuery}
                            onCategoryChange={(cats) => updateFilters({ selectedCategories: cats })}
                            onBrandChange={(brds) => updateFilters({ selectedBrands: brds })}
                            onMaterialChange={(mats) => updateFilters({ selectedMaterials: mats })}
                            onPriceChange={(range) => updateFilters({ minPrice: range.min, maxPrice: range.max })}
                            onInStockChange={(val) => updateFilters({ inStock: val })}
                            onSaleChange={(val) => updateFilters({ onSale: val })}
                            onNewChange={(val) => updateFilters({ isNew: val })}
                            onSearchChange={(q) => updateFilters({ searchQuery: q })}
                            onClearAll={handleClearAll}
                            activeFilterCount={activeFilters.length}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar - Mobile Optimized */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-8 sticky top-4 z-40 shadow-sm">
                            <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                                {/* Left: Filter Button (Mobile) + Results */}
                                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 min-w-0">
                                    <button
                                        onClick={() => setMobileFiltersOpen(true)}
                                        className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#12403C] text-white rounded-full font-medium text-xs shadow-sm active:scale-95 transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                                        </svg>
                                        <span>{t.shop.filter_btn}</span>
                                        {activeFilters.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-[#d4af37] text-[#12403C] rounded-full px-1">
                                                {activeFilters.length}
                                            </span>
                                        )}
                                    </button>

                                    <p className="text-xs md:text-sm text-gray-600 whitespace-nowrap">
                                        <span className="font-bold text-[#12403C]">{filteredAndSortedProducts.length}</span>
                                        <span className="hidden sm:inline"> {language === 'ar' ? t.shop.products_count : 'Products'}</span>
                                        <span className="sm:hidden"> {language === 'ar' ? t.shop.products_items : 'items'}</span>
                                    </p>
                                </div>

                                {/* Right: View Mode + Sort */}
                                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                                    {/* View Mode */}
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-shrink-0">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                            title={t.shop.view_grid}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                                <rect x="14" y="14" width="7" height="7" rx="1" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode("categories")}
                                            className={`p-2 rounded ${viewMode === "categories" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                            title="View by Categories"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="4" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                <rect x="11" y="6" width="9" height="2" rx="1" />
                                                <rect x="4" y="11" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                <rect x="11" y="12" width="9" height="2" rx="1" />
                                                <rect x="4" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                <rect x="11" y="18" width="9" height="2" rx="1" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Sort */}
                                    <div className="flex-shrink-0">
                                        <SortDropdown
                                            value={filters.sortBy}
                                            onChange={(val) => updateFilters({ sortBy: val })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Active Filters */}
                            {activeFilters.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <ActiveFilters
                                        filters={activeFilters}
                                        onRemove={handleRemoveFilter}
                                        onClearAll={handleClearAll}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Products Grid */}
                        <ProductGrid
                            products={viewMode === "categories" ? filteredAndSortedProducts : paginatedProducts}
                            viewMode={viewMode}
                            isLoading={isPending}
                            categories={categories}
                        />

                        {/* Pagination */}
                        {viewMode !== "categories" && totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t.shop.previous}
                                </button>

                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum = i + 1;

                                    if (totalPages > 5) {
                                        if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`px-4 py-2 rounded-lg transition-colors ${currentPage === pageNum
                                                ? "bg-[#12403C] text-white"
                                                : "border border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t.shop.next}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile-only Content (Edge-to-Edge) */}
            <div className="block md:hidden pb-20">
                {/* Mobile Toolbar */}
                <div className="px-4 mb-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            {/* Left: Filter Button + Results Count */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setMobileFiltersOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-[#12403C] text-white rounded-full font-medium text-xs shadow-sm"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                                    </svg>
                                    <span>{t.shop.filter_btn}</span>
                                    {activeFilters.length > 0 && (
                                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-[#d4af37] text-[#12403C] rounded-full px-1">
                                            {activeFilters.length}
                                        </span>
                                    )}
                                </button>
                                <p className="text-xs text-gray-600 whitespace-nowrap">
                                    <span className="font-bold text-[#12403C]">{filteredAndSortedProducts.length}</span>
                                    <span> {language === 'ar' ? t.shop.products_items : 'items'}</span>
                                </p>
                            </div>

                            {/* Right: View Mode + Sort */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                        title={t.shop.view_grid}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setViewMode("categories")}
                                        className={`p-2 rounded ${viewMode === "categories" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                        title="View by Categories"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="4" y="5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <rect x="11" y="6" width="9" height="2" rx="1" />
                                            <rect x="4" y="11" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <rect x="11" y="12" width="9" height="2" rx="1" />
                                            <rect x="4" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                            <rect x="11" y="18" width="9" height="2" rx="1" />
                                        </svg>
                                    </button>
                                </div>
                                <SortDropdown
                                    value={filters.sortBy}
                                    onChange={(val) => updateFilters({ sortBy: val })}
                                />
                            </div>
                        </div>

                        {/* Active Filters */}
                        {activeFilters.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <ActiveFilters
                                    filters={activeFilters}
                                    onRemove={handleRemoveFilter}
                                    onClearAll={handleClearAll}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Product Grid */}
                <div className={viewMode === "categories" ? "" : "px-4"}>
                    <ProductGrid
                        products={viewMode === "categories" ? filteredAndSortedProducts : paginatedProducts}
                        viewMode={viewMode}
                        isLoading={isPending}
                        categories={categories}
                    />
                </div>

                {/* Mobile Pagination */}
                {viewMode !== "categories" && totalPages > 1 && (
                    <div className="mt-8 px-4 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <span className="text-sm font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Filters */}
            <MobileFilters
                isOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
                categories={categories}
                brands={brands}
                materials={materials}
                selectedCategories={filters.selectedCategories}
                selectedBrands={filters.selectedBrands}
                selectedMaterials={filters.selectedMaterials}
                priceRange={{ min: filters.minPrice, max: filters.maxPrice }}
                minPrice={absoluteMinPrice}
                maxPrice={absoluteMaxPrice}
                inStock={filters.inStock}
                onSale={filters.onSale}
                isNew={filters.isNew}
                onCategoryChange={(cats) => updateFilters({ selectedCategories: cats })}
                onBrandChange={(brds) => updateFilters({ selectedBrands: brds })}
                onMaterialChange={(mats) => updateFilters({ selectedMaterials: mats })}
                onPriceChange={(range) => updateFilters({ minPrice: range.min, maxPrice: range.max })}
                onInStockChange={(val) => updateFilters({ inStock: val })}
                onSaleChange={(val) => updateFilters({ onSale: val })}
                onNewChange={(val) => updateFilters({ isNew: val })}
                onClearAll={handleClearAll}
                activeFilterCount={activeFilters.length}
            />
        </div >
    );
}
