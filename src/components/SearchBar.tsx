"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  brand?: string | null;
}

interface SearchBarProps {
  onProductSelect?: () => void;
}

export default function SearchBar({ onProductSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // API Search Logic
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const addToHistory = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;

    setHistory(prev => {
      const newHistory = [cleanTerm, ...prev.filter(h => h !== cleanTerm)].slice(0, 5);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('search_history');
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.products || []);
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToHistory(query);
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
      onProductSelect?.();
    }
  };

  const handleResultClick = (id: string, name: string) => {
    addToHistory(name);
    router.push(`/product/${id}`);
    setIsOpen(false);
    setQuery("");
    onProductSelect?.();
  };

  const formatPrice = (p: number) => `${t.common.currency} ${p.toLocaleString()}`;

  return (
    <div ref={wrapperRef} className="search-wrapper">
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t.common.search_placeholder}
          className="search-input"
        />
        <button type="submit" className="search-btn" aria-label={t.common.search}>
          {isLoading ? (
             <div className="spinner" style={{ width: 16, height: 16, border: '2px solid #ccc', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 4px;
        }

        .history-title {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #999;
          letter-spacing: 0.5px;
        }

        .clear-history-btn {
          background: none;
          border: none;
          font-size: 11px;
          color: #999;
          cursor: pointer;
          padding: 4px;
        }

        .clear-history-btn:hover {
          color: #ff4d4f;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px 16px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-size: 13px;
          color: #666;
          transition: background 0.2s;
        }

        .history-item:hover {
          background: #f9f9f9;
          color: #12403C;
        }

        .history-icon {
          color: #ccc;
        }
      `}</style>
      
      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="search-dropdown">
          {/* Recent Searches (History) */}
          {query.trim().length === 0 && history.length > 0 && (
            <div className="search-history">
              <div className="history-header">
                <span className="history-title">{t.common.recent_searches}</span>
                <button
                  onClick={clearHistory}
                  className="clear-history-btn"
                >
                  {t.common.clear_all}
                </button>
              </div>
              <div className="history-list">
                {history.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(term);
                      router.push(`/shop?q=${encodeURIComponent(term)}`);
                      setIsOpen(false);
                    }}
                    className="history-item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="history-icon">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Search Results */}
          {query.trim().length >= 2 && (
            <>
              {results.length > 0 || isLoading ? (
                <>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      className="search-result-item"
                      onClick={() => handleResultClick(result.id, result.name)}
                    >
                      {result.image && (
                        <Image
                          src={result.image}
                          alt={result.name}
                          width={48}
                          height={48}
                          className="search-result-image"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                      <div className="search-result-info">
                        <p className="search-result-name">{result.name}</p>
                        <p className="search-result-meta">
                          {result.category && <span>{result.category}</span>}
                          {result.brand && <span> • {result.brand}</span>}
                          <span className="search-result-price">{formatPrice(result.price)}</span>
                        </p>
                      </div>
                    </button>
                  ))}
                  {!isLoading && (
                    <button
                      className="search-view-all"
                      onClick={handleSearch}
                    >
                      {t.common.view_all_results.replace('{query}', query)}
                    </button>
                  )}
                </>
              ) : (
                <div className="search-no-results">
                  <p>{t.common.no_results.replace('{query}', query)}</p>
                  <div className="search-suggestions">
                    <p className="suggestions-title">
                      {t.common.try_searching}
                    </p>
                    <div className="suggestion-chips">
                      <button
                        onClick={() => router.push('/shop?category=watches')}
                        className="suggestion-chip"
                      >
                        {language === 'ar' ? 'ساعات' : 'Watches'}
                      </button>
                      <button
                        onClick={() => router.push('/shop?category=belts')}
                        className="suggestion-chip"
                      >
                        {language === 'ar' ? 'أحزمة' : 'Belts'}
                      </button>
                      <button
                        onClick={() => router.push('/shop?category=accessories')}
                        className="suggestion-chip"
                      >
                        {language === 'ar' ? 'اكسسوارات' : 'Accessories'}
                      </button>
                    </div>
                    <button
                      onClick={() => router.push('/shop')}
                      className="browse-all-btn"
                    >
                      {t.common.browse_all_products}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .search-wrapper {
          position: relative;
          width: 100%;
          max-width: 320px;
        }

        .search-form {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 30px;
          overflow: hidden;
          transition: all 0.2s;
          height: 36px; /* Explicit thinner height */
        }

        .search-form:focus-within {
          border-color: #12403C;
          box-shadow: 0 0 0 3px rgba(18, 64, 60, 0.1);
        }

        .search-input {
          flex: 1;
          border: none;
          padding: 0 16px; /* Reduced padding */
          font-size: 13px; /* Slightly smaller font */
          outline: none;
          background: transparent;
          direction: ltr;
          height: 100%;
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-btn {
          padding: 0 14px; /* Adjust padding */
          height: 100%; /* Fill height */
          display: flex; /* Centering */
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
        }

        .search-btn:hover {
          color: #12403C;
        }

        .search-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          z-index: 1000;
          animation: dropdownFade 0.2s ease;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          width: 100%;
          border: none;
          background: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }

        .search-result-item:hover {
          background: #f5f5f5;
        }

        .search-result-image {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
          background: #f0f0f0;
        }

        .search-result-info {
          flex: 1;
        }

        .search-result-name {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
          color: #12403C;
        }

        .search-result-meta {
          margin: 4px 0 0;
          font-size: 12px;
          color: #888;
          display: flex;
          gap: 8px;
        }

        .search-result-price {
          color: #12403C;
          font-weight: 600;
        }

        .search-view-all {
          display: block;
          width: 100%;
          padding: 12px;
          background: #f9f9f9;
          border: none;
          border-top: 1px solid #eee;
          cursor: pointer;
          font-size: 13px;
          color: #12403C;
          font-weight: 600;
          transition: background 0.2s;
        }

        .search-view-all:hover {
          background: #f0f0f0;
        }

        .search-no-results {
          padding: 24px;
          text-align: center;
          color: #888;
        }
        
        .search-suggestions {
          margin-top: 16px;
        }
        
        .suggestions-title {
          font-size: 12px;
          color: #666;
          margin-bottom: 12px;
        }
        
        .suggestion-chips {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        
        .suggestion-chip {
          padding: 6px 12px;
          background: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 20px;
          font-size: 12px;
          color: #12403C;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .suggestion-chip:hover {
          background: #12403C;
          color: white;
          border-color: #12403C;
        }
        
        .browse-all-btn {
          display: block;
          width: 100%;
          padding: 10px;
          background: #12403C;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .browse-all-btn:hover {
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .search-wrapper {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
