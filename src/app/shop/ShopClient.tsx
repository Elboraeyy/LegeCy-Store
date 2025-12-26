"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { useIsClient } from "@/hooks/useIsClient";
import { fadeUpSlow, staggerContainerSlow } from "@/lib/motion";
import { fetchShopProducts, ShopProduct } from "@/lib/actions/shop";

export default function ShopClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart, toggleFav, isFav } = useStore();
  const isClient = useIsClient();

  // --- Product State (from Database) ---
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Load products from database
  useEffect(() => {
    let mounted = true;
    
    const loadProducts = async () => {
      try {
        const data = await fetchShopProducts();
        if (mounted) {
          setProducts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        if (mounted) setLoading(false);
      }
    };

    loadProducts();
    return () => { mounted = false; };
  }, []);

  // --- Filter States ---
  const [category, setCategory] = useState("all");
  const initialSearch = searchParams.get('search') || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [sortOption, setSortOption] = useState("default");
  const [visibleCount, setVisibleCount] = useState(9); // Initial 9

  // Sync state with URL param changes
  // Sync state with URL param changes
  useEffect(() => {
    const q = searchParams.get('search');
    if (q && q !== searchQuery) {
        setSearchQuery(q);
        setVisibleCount(9); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- Derived Data ---
  const uniqueCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search (Name)
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. Category
      if (category !== "all" && p.category !== category) {
        return false;
      }

      // 3. Price Range
      const min = priceRange.min ? parseFloat(priceRange.min) : 0;
      const max = priceRange.max ? parseFloat(priceRange.max) : Infinity;
      if (p.price < min || p.price > max) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, category, priceRange]);

  // --- Sorting Logic ---
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    if (sortOption === "price-asc") {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price-desc") {
      sorted.sort((a, b) => b.price - a.price);
    } else if (sortOption === "newest") {
      // Already sorted by createdAt desc from database
    }
    return sorted;
  }, [filteredProducts, sortOption]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  // --- Handlers ---
  const resetFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setSortOption("default");
    setCategory("all");
    setVisibleCount(9);
  };

  if (loading) {
    return (
      <main>
        <section className="shop-hero">
          <div className="container">
            <h1>The Collection</h1>
            <p>Loading products...</p>
          </div>
        </section>
        <section className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading our exclusive collection...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
             <h1>The Collection</h1>
          </Reveal>
          <Reveal delay={0.2}>
             <p>Discover our exclusive range of precision-crafted timepieces.</p>
          </Reveal>
        </div>
      </section>

      <section className="container shop-layout">
        <aside className="shop-sidebar">
          {/* Search Bar (Sidebar) */}
          <Reveal width="100%">
            <div className="filter-group filter-section">
               <div className="search-container">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search watches..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setVisibleCount(9);
                    }}
                  />
                </div>
            </div>
          </Reveal>

          {/* Categories */}
          <Reveal width="100%" delay={0.1}>
            <div className="filter-group filter-section">
              <h3 className="filter-title">Categories</h3>
              <ul className="category-list">
                <li>
                  <a
                    href="#"
                    className={category === "all" ? "active" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setCategory("all");
                      setVisibleCount(9);
                    }}
                  >
                    All Watches
                  </a>
                </li>
                {uniqueCategories.map((cat) => (
                  <li key={cat}>
                    <a
                      href="#"
                      className={category === cat ? "active" : ""}
                      onClick={(e) => {
                        e.preventDefault();
                        setCategory(cat!);
                        setVisibleCount(9);
                      }}
                    >
                      {cat}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Price Filter */}
          <Reveal width="100%" delay={0.2}>
            <div className="filter-group filter-section">
              <h3 className="filter-title">Price Range (EGP)</h3>
              <div className="price-range-inputs">
                <input
                  type="number"
                  className="price-input"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <span className="price-separator">-</span>
                <input
                  type="number"
                  className="price-input"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>
          </Reveal>

           <Reveal width="100%" delay={0.3}>
              <button className="reset-btn" onClick={resetFilters}>
                Reset All Filters
              </button>
           </Reveal>
        </aside>

        <div className="shop-content">
          <Reveal width="100%">
            <div className="shop-controls-header">
               <div className="results-count">
                 Showing {visibleProducts.length} of {sortedProducts.length} results
               </div>
               
               <div className="sort-container">
                  <span className="sort-label">Sort by:</span>
                  <select 
                      className="sort-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                  >
                      <option value="default">Featured</option>
                      <option value="newest">Newest Arrivals</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                  </select>
               </div>
            </div>
          </Reveal>

          <motion.div 
            className="grid product-grid-large" 
            id="shop-box"
            initial="hidden"
            animate="visible"
            variants={staggerContainerSlow}
            key={visibleCount + category + searchQuery + sortOption} 
          >
            {visibleProducts.map((p) => (
              <motion.div key={p.id} className="product-card premium" variants={fadeUpSlow}>
                <div className="product-media" style={{ cursor: "pointer", position: "relative" }}>
                  <Link href={`/product/${p.id}`} style={{ display: "block", width: "100%", height: "100%" }}>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: '#f8f8f8',
                        color: '#999'
                      }}>
                        No Image
                      </div>
                    )}
                  </Link>
                  {!p.inStock && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: '#ef4444',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      Out of Stock
                    </div>
                  )}
                </div>
                <div className="product-body">
                  <h3
                    className="product-title"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/product/${p.id}`)}
                  >
                    {p.name}
                  </h3>
                  <p className="product-price">{formatPrice(p.price)}</p>
                  <div className="product-actions">
                    <Link
                      href={`/product/${p.id}`}
                      className="btn-icon"
                      title="View Details"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </Link>
                    <button
                      className="btn-icon"
                      title="Add to Cart"
                      onClick={() => addToCart(p.id)}
                      disabled={!p.inStock}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <path d="M16 10a4 4 0 0 1-8 0"></path>
                      </svg>
                    </button>
                    <button
                      className="btn-icon"
                      title="Favorite"
                      onClick={() => toggleFav(p.id)}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isClient && isFav(p.id) ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div id="load-more-container" className="load-more-wrapper">
            {visibleProducts.length < filteredProducts.length && (
              <Reveal>
                <button
                  id="load-more-btn"
                  className="btn-icon-large"
                  aria-label="Load More Products"
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                  </svg>
                </button>
              </Reveal>
            )}
          </div>

          {sortedProducts.length === 0 && (
             <Reveal width="100%">
                <div id="empty-shop" className="empty-state">
                  <h3>No products found</h3>
                  <p>Try adjusting your search or filters to find what you&apos;re looking for.</p>
                  <button className="btn btn-outline" style={{marginTop: '16px'}} onClick={resetFilters}>Clear Filters</button>
                </div>
             </Reveal>
          )}
        </div>
      </section>
    </main>
  );
}
