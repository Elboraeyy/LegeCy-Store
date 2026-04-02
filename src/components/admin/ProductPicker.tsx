/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import Image from "next/image";
// import { searchProducts } from "@/lib/actions/product-search-actions"; // Assuming a search action exists or using a new one

// We'll Create a quick server action for searching products for admin picker
import { searchAdminProducts } from "@/lib/actions/product-search-actions";

interface ProductPickerProps {
    value?: string[]; // Array of IDs - Optional if we don't control it fully yet
    onChange: (ids: string[]) => void;
    isMulti?: boolean;
    isDisabled?: boolean;
    initialOptions?: OptionType[];
}

import { StylesConfig, GroupBase } from "react-select";

interface OptionType {
    label: string;
    value: string;
    image?: string | null;
}

export default function ProductPicker({ onChange, isMulti = true, isDisabled, initialOptions = [] }: ProductPickerProps) {
    const [selected, setSelected] = useState<OptionType[]>(initialOptions);

    const loadOptions = async (inputValue: string) => {
        const products = await searchAdminProducts(inputValue);
        return products.map(p => ({ label: p.name, value: p.id, image: p.imageUrl || p.images?.[0]?.url }));
    };

    const formatOptionLabel = (option: OptionType) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {option.image ? (
                <div style={{ width: '28px', height: '28px', position: 'relative', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid #e5e7eb' }}>
                    <Image src={option.image} alt={option.label} fill sizes="28px" style={{ objectFit: 'cover' }} />
                </div>
            ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', backgroundColor: '#f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
            )}
            <span style={{ fontWeight: 500, fontSize: '13px' }}>{option.label}</span>
        </div>
    );

    const customStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
        control: (base) => ({
            ...base,
            background: '#fff',
            borderColor: '#e5e7eb',
            borderRadius: '0.5rem',
            padding: '4px',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#12403C'
            },
            color: '#111827',
            fontSize: '13px'
        }),
        menu: (base) => ({
            ...base,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            overflow: 'hidden',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#f3f4f6' : 'transparent',
            color: state.isFocused ? '#12403C' : '#374151',
            cursor: 'pointer',
            padding: '10px 14px'
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: 'var(--admin-hover)',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: 'var(--admin-text)',
        }),
        input: (base) => ({
            ...base,
            color: 'var(--admin-text)'
        })
    };

    return (
        <AsyncSelect
            isMulti={isMulti}
            cacheOptions
            defaultOptions
            value={selected}
            loadOptions={loadOptions}
            formatOptionLabel={formatOptionLabel}
            onChange={(newValue) => {
                const options = newValue as unknown as OptionType[];
                setSelected(options || []);
                const ids = options ? options.map(o => o.value) : [];
                onChange(ids);
            }}
            isDisabled={isDisabled}
            styles={customStyles}
            placeholder="Search products..."
            noOptionsMessage={() => "Type to search..."}
        />
    );
}
