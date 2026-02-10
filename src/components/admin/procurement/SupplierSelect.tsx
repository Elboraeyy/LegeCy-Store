"use client";

// import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import { searchSuppliers } from "@/lib/actions/supplier-actions";
// import { toast } from "sonner";

interface SupplierSelectProps {
    value: string;
    onChange: (value: string) => void;
    isDisabled?: boolean;
}

import { StylesConfig, GroupBase } from "react-select";

interface OptionType {
    label: string;
    value: string;
}

export default function SupplierSelect({ onChange, isDisabled }: SupplierSelectProps) {
    // Value prop is unused for now as we don't have the initial label object.
    // In a real implementation we would fetch it or pass it.

    const loadOptions = async (inputValue: string) => {
        const suppliers = await searchSuppliers(inputValue);
        return suppliers.map(s => ({ label: s.name, value: s.id }));
    };

    /*
    const handleCreate = async (inputValue: string) => {
        try {
            const newSupplier = await createQuickSupplier(inputValue);
            toast.success(`Supplier "${newSupplier.name}" created`);
            onChange(newSupplier.id);
            return { label: newSupplier.name, value: newSupplier.id };
        } catch (error) {
            toast.error("Failed to create supplier");
            return null;
        }
    };
    */

    // simplified styles to match admin theme
    const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
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
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? 'var(--admin-hover)' : 'transparent',
            color: 'var(--admin-text)'
        }),
        input: (base) => ({
            ...base,
            color: 'var(--admin-text)'
        }),
        singleValue: (base) => ({
            ...base,
            color: 'var(--admin-text)'
        })
    };

    return (
        <div style={{ position: 'relative' }}>
            <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadOptions}
                onChange={(newValue) => {
                    const option = newValue as unknown as OptionType;
                    onChange(option?.value || "");
                }}
                isDisabled={isDisabled}
                styles={customStyles}
                placeholder="Search or Select Supplier..."
            // Note: Creatable logic requires CreatableSelect, using simpler AsyncSelect for now with assumption:
            // If we want "Add New", we should strictly use `react-select/async-creatable`.
            // For this step I'll stick to AsyncSelect to minimize dependencies if creatable isn't installed.
            // If user wants to create, they probably need a button or we switch to Creatable.
            />
            {/* 
                Feature improvement: Add a small "+ New" button execution if requested. 
                For now, simple search.
            */}
        </div>
    );
}
