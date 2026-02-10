"use client";

import AsyncSelect from "react-select/async";
// import { searchProducts } from "@/lib/actions/product-search-actions"; // Assuming a search action exists or using a new one

// We'll Create a quick server action for searching products for admin picker
import { searchAdminProducts } from "@/lib/actions/product-search-actions";

interface ProductPickerProps {
    value?: string[]; // Array of IDs - Optional if we don't control it fully yet
    onChange: (ids: string[]) => void;
    isMulti?: boolean;
    isDisabled?: boolean;
}

import { StylesConfig, GroupBase } from "react-select";

interface OptionType {
    label: string;
    value: string;
}

export default function ProductPicker({ onChange, isMulti = true, isDisabled }: ProductPickerProps) {

    const loadOptions = async (inputValue: string) => {
        const products = await searchAdminProducts(inputValue);
        return products.map(p => ({ label: p.name, value: p.id }));
    };

    const customStyles: StylesConfig<OptionType, boolean, GroupBase<OptionType>> = {
        control: (base) => ({
            ...base,
            background: 'var(--admin-card-bg)',
            borderColor: 'var(--admin-border)',
            color: 'var(--admin-text)',
            fontSize: '13px'
        }),
        menu: (base) => ({
            ...base,
            background: 'var(--admin-card-bg)',
            border: '1px solid var(--admin-border)',
            zIndex: 9999
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'var(--admin-hover)' : 'transparent',
            color: 'var(--admin-text)'
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
            loadOptions={loadOptions}
            onChange={(newValue) => {
                const options = newValue as unknown as OptionType[];
                const ids = options ? options.map(o => o.value) : [];
                onChange(ids);
            }}
            isDisabled={isDisabled}
            styles={customStyles}
            placeholder="Search products..."
        />
    );
}
