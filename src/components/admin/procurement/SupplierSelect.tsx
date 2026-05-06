/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import AsyncCreatableSelect from "react-select/async-creatable";
import { searchSuppliers, createQuickSupplier } from "@/lib/actions/supplier-actions";
import { toast } from "sonner";
import { StylesConfig, GroupBase } from "react-select";

interface OptionType {
    label: string;
    value: string;
}

interface SupplierSelectProps {
    value?: string;
    initialOption?: { id: string; name: string } | null;
    onChange: (value: string) => void;
    isDisabled?: boolean;
}

export default function SupplierSelect({ value, onChange, isDisabled, initialOption }: SupplierSelectProps) {
    const formattedInitial = initialOption ? { label: initialOption.name, value: initialOption.id } : null;
    const [selected, setSelected] = useState<OptionType | null>(formattedInitial);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!value) setSelected(null);
    }, [value]);

    const loadOptions = async (inputValue: string) => {
        const suppliers = await searchSuppliers(inputValue);
        return suppliers.map(s => ({ label: s.name, value: s.id }));
    };

    const handleCreate = async (inputValue: string) => {
        setIsLoading(true);
        try {
            const newSupplier = await createQuickSupplier(inputValue);
            toast.success(`Supplier "${newSupplier.name}" created successfully`);
            const newlyCreatedOption = { label: newSupplier.name, value: newSupplier.id };
            setSelected(newlyCreatedOption);
            onChange(newSupplier.id);
        } catch (error) {
            toast.error("Failed to create supplier");
        } finally {
            setIsLoading(false);
        }
    };

    const customStyles: StylesConfig<OptionType, false, GroupBase<OptionType>> = {
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
        input: (base) => ({
            ...base,
            color: '#111827'
        }),
        singleValue: (base) => ({
            ...base,
            color: '#111827'
        })
    };

    return (
        <div style={{ position: 'relative' }}>
            <AsyncCreatableSelect
                cacheOptions
                defaultOptions
                loadOptions={loadOptions}
                isDisabled={isDisabled || isLoading}
                isLoading={isLoading}
                value={selected}
                onChange={(newValue) => {
                    const option = newValue as OptionType | null;
                    setSelected(option);
                    onChange(option?.value || "");
                }}
                onCreateOption={handleCreate}
                styles={customStyles}
                placeholder="Search or Select Supplier..."
                formatCreateLabel={(inputValue) => `+ Create new supplier "${inputValue}"`}
            />
        </div>
    );
}
