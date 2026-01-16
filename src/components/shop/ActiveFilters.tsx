"use client";

import React from "react";

interface ActiveFilter {
  type: string;
  value: string;
  label: string;
}

interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (filter: ActiveFilter) => void;
  onClearAll: () => void;
}

export default function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">Active Filters:</span>
      
      {filters.map((filter, index) => (
        <button
          key={`${filter.type}-${filter.value}-${index}`}
          onClick={() => onRemove(filter)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#12403C] text-white text-sm rounded-full hover:bg-[#d4af37] transition-colors group"
        >
          <span>{filter.label}</span>
          <svg
            className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}

      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-[#d4af37] hover:text-[#12403C] font-medium underline transition-colors"
        >
          Clear All ({filters.length})
        </button>
      )}
    </div>
  );
}
