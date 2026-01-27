"use client";

import React, { useState } from "react";

import { useLanguage } from "@/context/LanguageContext";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const SORT_OPTIONS: SortOption[] = [
    { value: "featured", label: t.shop.sort.featured },
    { value: "newest", label: t.shop.sort.newest },
    { value: "price-asc", label: t.shop.sort.price_low },
    { value: "price-desc", label: t.shop.sort.price_high },
    { value: "name-asc", label: t.shop.sort.name_az },
    { value: "name-desc", label: t.shop.sort.name_za },
  ];

  const selectedOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];

  const handleSelect = (option: SortOption) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-[#d4af37] transition-colors text-sm font-medium text-gray-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M7 12h10m-7 6h4" />
        </svg>
        <span>{selectedOption.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-10"
          />
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  option.value === value
                    ? "bg-[#FCF8F3] text-[#12403C] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
                {option.value === value && (
                  <svg
                    className="inline ml-2 w-4 h-4 text-[#d4af37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
