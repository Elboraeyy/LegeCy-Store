"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  name,
  required,
  disabled,
  className = "",
  searchPlaceholder = "Search...",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      opt.value.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`custom-select-container ${className} ${disabled ? 'disabled' : ''}`}
    >
      {/* Hidden native select for form submission */}
      {name && (
        <select
          name={name}
          value={value}
          required={required}
          style={{ display: 'none' }}
          onChange={() => {}}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {/* Custom trigger button */}
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={selectedOption ? '' : 'placeholder'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="chevron"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {/* Custom dropdown panel */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {/* Search Input */}
          <div className="custom-select-search-container">
            <svg
              className="search-icon"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="custom-select-search"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="custom-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`custom-select-option ${option.value === value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  disabled={option.disabled}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="check-icon"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="custom-select-no-results">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
