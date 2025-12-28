'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

export type DropdownOption = {
    value: string;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
};

type AdminDropdownProps = {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'pill' | 'outline';
    disabled?: boolean;
    icon?: ReactNode;
};

export default function AdminDropdown({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
    size = 'md',
    variant = 'default',
    disabled = false,
    icon,
}: AdminDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const displayLabel = selectedOption?.label || placeholder;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    // Size classes
    const sizeClasses = {
        sm: 'admin-dropdown--sm',
        md: 'admin-dropdown--md',
        lg: 'admin-dropdown--lg',
    };

    // Variant classes
    const variantClasses = {
        default: 'admin-dropdown--default',
        pill: 'admin-dropdown--pill',
        outline: 'admin-dropdown--outline',
    };

    return (
        <div
            ref={dropdownRef}
            className={`admin-dropdown ${sizeClasses[size]} ${variantClasses[variant]} ${isOpen ? 'admin-dropdown--open' : ''} ${disabled ? 'admin-dropdown--disabled' : ''} ${className}`}
        >
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="admin-dropdown__trigger"
                disabled={disabled}
            >
                {icon && <span className="admin-dropdown__icon">{icon}</span>}
                <span className="admin-dropdown__label">{displayLabel}</span>
                <svg
                    className={`admin-dropdown__chevron ${isOpen ? 'admin-dropdown__chevron--open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="admin-dropdown__menu">
                    <div className="admin-dropdown__menu-inner">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => !option.disabled && handleSelect(option.value)}
                                className={`admin-dropdown__option ${option.value === value ? 'admin-dropdown__option--selected' : ''} ${option.disabled ? 'admin-dropdown__option--disabled' : ''}`}
                                disabled={option.disabled}
                            >
                                {option.icon && (
                                    <span className="admin-dropdown__option-icon">{option.icon}</span>
                                )}
                                <span className="admin-dropdown__option-label">{option.label}</span>
                                {option.value === value && (
                                    <svg
                                        className="admin-dropdown__check"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
