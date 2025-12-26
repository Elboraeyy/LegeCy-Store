"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SearchResult {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

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
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  const handleResultClick = (id: string) => {
    router.push(`/product/${id}`);
    setIsOpen(false);
    setQuery("");
  };

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

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
          placeholder="Search products..."
          className="search-input"
        />
        <button type="submit" className="search-btn" aria-label="Search">
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
      `}</style>
      
      {/* Search Results Dropdown */}
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="search-dropdown">
          {results.map((result) => (
            <button
              key={result.id}
              className="search-result-item"
              onClick={() => handleResultClick(result.id)}
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
                  <span className="search-result-price">{formatPrice(result.price)}</span>
                </p>
              </div>
            </button>
          ))}
          <button
            className="search-view-all"
            onClick={handleSearch}
          >
            View all results for &quot;{query}&quot;
          </button>
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="search-dropdown">
          <div className="search-no-results">
            <p>No results for &quot;{query}&quot;</p>
          </div>
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
        }

        .search-form:focus-within {
          border-color: #1a3c34;
          box-shadow: 0 0 0 3px rgba(26, 60, 52, 0.1);
        }

        .search-input {
          flex: 1;
          border: none;
          padding: 10px 16px;
          font-size: 14px;
          outline: none;
          background: transparent;
          direction: ltr;
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-btn {
          padding: 10px 14px;
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          transition: color 0.2s;
        }

        .search-btn:hover {
          color: #1a3c34;
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
          color: #1a3c34;
        }

        .search-result-meta {
          margin: 4px 0 0;
          font-size: 12px;
          color: #888;
          display: flex;
          gap: 8px;
        }

        .search-result-price {
          color: #1a3c34;
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
          color: #1a3c34;
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

        @media (max-width: 768px) {
          .search-wrapper {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
