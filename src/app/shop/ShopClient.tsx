"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import FilterSidebar from "@/components/shop/FilterSidebar";
import MobileFilters from "@/components/shop/MobileFilters";
import ProductGrid from "@/components/shop/ProductGrid";
import SortDropdown from "@/components/shop/SortDropdown";
import ActiveFilters from "@/components/shop/ActiveFilters";
import { Product } from "@/types/product";

interface ShopClientProps {
    initialProducts?: Product[];
    categories?: { id: string; name: string; slug: string }[];
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

    // State
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Filters from URL
    const selectedCategories = useMemo(() => searchParams.get("category")?.split(",").filter(Boolean) || [], [searchParams]);
    const selectedBrands = useMemo(() => searchParams.get("brands")?.split(",").filter(Boolean) || [], [searchParams]);
    const selectedMaterials = useMemo(() => searchParams.get("materials")?.split(",").filter(Boolean) || [], [searchParams]);
    const sortBy = searchParams.get("sort") || "featured";
    const searchQuery = searchParams.get("q") || "";
    const minPrice = Number(searchParams.get("minPrice")) || 0;
    const maxPrice = Number(searchParams.get("maxPrice")) || 3000;
    const inStock = searchParams.get("inStock") === "true" ? true : searchParams.get("inStock") === "false" ? false : null;
    const onSale = searchParams.get("onSale") === "true" ? true : null;
    const isNew = searchParams.get("new") === "true" ? true : null;

    // Fixed price bounds (0-3000)
    const absoluteMinPrice = 0;
    const absoluteMaxPrice = 3000;

    // Update URL
    const updateFilters = React.useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "" || value === "null") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        router.push(`/shop?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedCategories.length) params.set("category", selectedCategories.join(","));
                if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
                if (selectedMaterials.length) params.set("materials", selectedMaterials.join(","));
                if (searchQuery) params.set("q", searchQuery);
                if (minPrice > absoluteMinPrice) params.set("minPrice", minPrice.toString());
                if (maxPrice < absoluteMaxPrice) params.set("maxPrice", maxPrice.toString());
                if (inStock !== null) params.set("inStock", String(inStock));
                if (onSale) params.set("onSale", "true");
                if (isNew) params.set("new", "true");

                const res = await fetch(`/api/products?${params.toString()}`);
                const data = await res.json();
                setProducts(data.products || []);
            } catch (error) {
                console.error("Failed to fetch products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [searchParams, selectedCategories, selectedBrands, selectedMaterials, searchQuery, minPrice, maxPrice, inStock, onSale, isNew, absoluteMinPrice, absoluteMaxPrice]);

    // Filter and sort products
    const filteredAndSortedProducts = useMemo(() => {
        const result = [...products];

        // Apply sorting
        switch (sortBy) {
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
                // Featured - keep original order
                break;
        }

        return result;
    }, [products, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
    const paginatedProducts = filteredAndSortedProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Active filters
    const activeFilters = useMemo(() => {
        const filters: Array<{ type: string; value: string; label: string }> = [];

        selectedCategories.forEach(slug => {
            const cat = categories.find(c => c.slug === slug);
            if (cat) filters.push({ type: "category", value: slug, label: cat.name });
        });

        selectedBrands.forEach(id => {
            const brand = brands.find(b => b.id === id);
            if (brand) filters.push({ type: "brand", value: id, label: brand.name });
        });

        selectedMaterials.forEach(id => {
            const material = materials.find(m => m.id === id);
            if (material) filters.push({ type: "material", value: id, label: material.name });
        });

        if (minPrice > absoluteMinPrice || maxPrice < absoluteMaxPrice) {
            filters.push({
                type: "price",
                value: "price",
                label: `EGP ${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`,
            });
        }

        if (inStock === true) filters.push({ type: "inStock", value: "true", label: "In Stock" });
        if (onSale === true) filters.push({ type: "onSale", value: "true", label: "On Sale" });
        if (isNew === true) filters.push({ type: "new", value: "true", label: "New Arrivals" });

        return filters;
    }, [selectedCategories, selectedBrands, selectedMaterials, minPrice, maxPrice, inStock, onSale, isNew, categories, brands, materials, absoluteMinPrice, absoluteMaxPrice]);

    const handleRemoveFilter = (filter: { type: string; value: string }) => {
        switch (filter.type) {
            case "category":
                updateFilters({ category: selectedCategories.filter(c => c !== filter.value).join(",") || null });
                break;
            case "brand":
                updateFilters({ brands: selectedBrands.filter(b => b !== filter.value).join(",") || null });
                break;
            case "material":
                updateFilters({ materials: selectedMaterials.filter(m => m !== filter.value).join(",") || null });
                break;
            case "price":
                updateFilters({ minPrice: null, maxPrice: null });
                break;
            case "inStock":
                updateFilters({ inStock: null });
                break;
            case "onSale":
                updateFilters({ onSale: null });
                break;
            case "new":
                updateFilters({ new: null });
                break;
        }
    };

    const handleClearAll = () => {
        router.push("/shop");
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#FCF8F3]">
            {/* Hero Section - Mobile Optimized */}
            <div className="bg-gradient-to-br from-[#12403C] to-[#0E3330] text-center py-8 md:py-12 mb-4 md:mb-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
                <div className="container mx-auto px-4 lg:px-8 relative z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-normal mb-1 md:mb-2 text-[#FCF8F3] tracking-wide">
                        Discover Our Collection
                    </h1>
                    <p className="text-xs sm:text-sm text-[#FCF8F3]/70 max-w-xl mx-auto">
                        Explore our curated selection of luxury accessories
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
                        value={searchQuery}
                        onChange={(e) => updateFilters({ q: e.target.value || null })}
                        placeholder="Search products..."
                        className="w-full pl-12 pr-10 py-3.5 text-base bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-[#12403C] focus:ring-2 focus:ring-[#12403C]/10 shadow-sm transition-all placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => updateFilters({ q: null })}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 pb-20 md:pb-16">
                <div className="flex gap-8">
                    {/* Desktop Sidebar */}
                    <div className="hidden lg:block flex-shrink-0">
                        <FilterSidebar
                            categories={categories}
                            brands={brands}
                            materials={materials}
                            selectedCategories={selectedCategories}
                            selectedBrands={selectedBrands}
                            selectedMaterials={selectedMaterials}
                            priceRange={{ min: minPrice, max: maxPrice }}
                            minPrice={absoluteMinPrice}
                            maxPrice={absoluteMaxPrice}
                            inStock={inStock}
                            onSale={onSale}
                            isNew={isNew}
                            searchQuery={searchQuery}
                            onCategoryChange={(cats) => updateFilters({ category: cats.join(",") || null })}
                            onBrandChange={(brds) => updateFilters({ brands: brds.join(",") || null })}
                            onMaterialChange={(mats) => updateFilters({ materials: mats.join(",") || null })}
                            onPriceChange={(range) => updateFilters({ minPrice: String(range.min), maxPrice: String(range.max) })}
                            onInStockChange={(val) => updateFilters({ inStock: val === null ? null : String(val) })}
                            onSaleChange={(val) => updateFilters({ onSale: val === null ? null : "true" })}
                            onNewChange={(val) => updateFilters({ new: val === null ? null : "true" })}
                            onSearchChange={(q) => updateFilters({ q: q || null })}
                            onClearAll={handleClearAll}
                            activeFilterCount={activeFilters.length}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Toolbar - Mobile Optimized */}
                        <div className="bg-white rounded-xl md:rounded-xl border border-gray-100 p-3 md:p-4 mb-4 md:mb-6 sticky top-0 z-20 lg:static lg:z-auto shadow-sm lg:shadow-none">
                            <div className="flex items-center justify-between gap-2">
                                {/* Left: Filter Button (Mobile) + Results */}
                                <div className="flex items-center gap-2 md:gap-4">
                                    <button
                                        onClick={() => setMobileFiltersOpen(true)}
                                        className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-[#12403C] text-white rounded-full font-medium text-xs shadow-sm active:scale-95 transition-all"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                                        </svg>
                                        <span className="hidden xs:inline">Filters</span>
                                        {activeFilters.length > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold bg-[#d4af37] text-[#12403C] rounded-full px-1">
                                                {activeFilters.length}
                                            </span>
                                        )}
                                    </button>

                                    <p className="text-xs md:text-sm text-gray-600">
                                        <span className="font-bold text-[#12403C]">{filteredAndSortedProducts.length}</span>
                                        <span className="hidden sm:inline"> Products</span>
                                        <span className="sm:hidden"> items</span>
                                    </p>
                                </div>

                                {/* Right: View Mode + Sort */}
                                <div className="flex items-center gap-3">
                                    {/* View Mode */}
                                    <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setViewMode("grid")}
                                            className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                            title="Grid View"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="3" y="3" width="7" height="7" rx="1" />
                                                <rect x="14" y="3" width="7" height="7" rx="1" />
                                                <rect x="3" y="14" width="7" height="7" rx="1" />
                                                <rect x="14" y="14" width="7" height="7" rx="1" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode("list")}
                                            className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                            title="List View"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="8" y1="6" x2="21" y2="6" />
                                                <line x1="8" y1="12" x2="21" y2="12" />
                                                <line x1="8" y1="18" x2="21" y2="18" />
                                                <rect x="3" y="4" width="2" height="4" fill="currentColor" />
                                                <rect x="3" y="10" width="2" height="4" fill="currentColor" />
                                                <rect x="3" y="16" width="2" height="4" fill="currentColor" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setViewMode("compact")}
                                            className={`p-2 rounded ${viewMode === "compact" ? "bg-white shadow-sm" : "text-gray-500"}`}
                                            title="Compact Grid"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="2" y="2" width="4" height="4" rx="0.5" />
                                                <rect x="8" y="2" width="4" height="4" rx="0.5" />
                                                <rect x="14" y="2" width="4" height="4" rx="0.5" />
                                                <rect x="20" y="2" width="2" height="4" rx="0.5" />
                                                <rect x="2" y="8" width="4" height="4" rx="0.5" />
                                                <rect x="8" y="8" width="4" height="4" rx="0.5" />
                                                <rect x="14" y="8" width="4" height="4" rx="0.5" />
                                                <rect x="20" y="8" width="2" height="4" rx="0.5" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Sort */}
                                    <SortDropdown
                                        value={sortBy}
                                        onChange={(val) => updateFilters({ sort: val })}
                                    />
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
                            products={paginatedProducts}
                            viewMode={viewMode}
                            isLoading={isLoading}
                        />

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
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
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filters */}
            <MobileFilters
                isOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
                categories={categories}
                brands={brands}
                materials={materials}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedMaterials={selectedMaterials}
                priceRange={{ min: minPrice, max: maxPrice }}
                minPrice={absoluteMinPrice}
                maxPrice={absoluteMaxPrice}
                inStock={inStock}
                onSale={onSale}
                isNew={isNew}
                onCategoryChange={(cats) => updateFilters({ category: cats.join(",") || null })}
                onBrandChange={(brds) => updateFilters({ brands: brds.join(",") || null })}
                onMaterialChange={(mats) => updateFilters({ materials: mats.join(",") || null })}
                onPriceChange={(range) => updateFilters({ minPrice: String(range.min), maxPrice: String(range.max) })}
                onInStockChange={(val) => updateFilters({ inStock: val === null ? null : String(val) })}
                onSaleChange={(val) => updateFilters({ onSale: val === null ? null : "true" })}
                onNewChange={(val) => updateFilters({ new: val === null ? null : "true" })}
                onClearAll={handleClearAll}
                activeFilterCount={activeFilters.length}
            />
        </div >
    );
}
