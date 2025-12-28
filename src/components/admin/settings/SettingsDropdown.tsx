"use client";

import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import type { DropdownOption } from '@/components/admin/ui/AdminDropdown';

type SettingsDropdownProps = {
    value: string;
    onChange: (value: string) => void;
    options: DropdownOption[];
    className?: string;
};

// Simple wrapper for AdminDropdown to use in settings pages
export default function SettingsDropdown({ value, onChange, options, className = '' }: SettingsDropdownProps) {
    return (
        <AdminDropdown
            value={value}
            onChange={onChange}
            options={options}
            className={className}
            size="md"
            variant="default"
        />
    );
}

// Re-export DropdownOption type for convenience
export type { DropdownOption };
