'use client';

import { useState, useRef, useEffect } from 'react';

type ColorPickerProps = {
    value: string;
    onChange: (color: string) => void;
    presets?: string[];
    disabled?: boolean;
};

const defaultPresets = [
    '#1a3c34', '#2d5a4a', '#4a7c6f', // Greens
    '#d4af37', '#f0cf65', '#b8960c', // Golds
    '#1e40af', '#3b82f6', '#60a5fa', // Blues
    '#991b1b', '#dc2626', '#f87171', // Reds
    '#7c3aed', '#a855f7', '#c084fc', // Purples
    '#0d9488', '#14b8a6', '#5eead4', // Teals
    '#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#ffffff', // Grays
];

export default function ColorPicker({
    value,
    onChange,
    presets = defaultPresets,
    disabled = false,
}: ColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHexInput(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHexChange = (hex: string) => {
        setHexInput(hex);
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            onChange(hex);
        }
    };

    const handlePresetClick = (color: string) => {
        onChange(color);
        setHexInput(color);
    };

    return (
        <div ref={pickerRef} className={`color-picker ${disabled ? 'color-picker--disabled' : ''}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="color-picker-trigger"
                disabled={disabled}
            >
                <span 
                    className="color-picker-swatch" 
                    style={{ backgroundColor: value }}
                />
                <span className="color-picker-value">{value}</span>
                <svg
                    className={`color-picker-chevron ${isOpen ? 'color-picker-chevron--open' : ''}`}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div className="color-picker-dropdown">
                    <div className="color-picker-presets">
                        {presets.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handlePresetClick(color)}
                                className={`color-picker-preset ${color === value ? 'color-picker-preset--selected' : ''}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                    <div className="color-picker-custom">
                        <label className="color-picker-custom-label">Custom Hex</label>
                        <div className="color-picker-custom-row">
                            <input
                                type="color"
                                value={value}
                                onChange={(e) => handlePresetClick(e.target.value)}
                                className="color-picker-native"
                            />
                            <input
                                type="text"
                                value={hexInput}
                                onChange={(e) => handleHexChange(e.target.value)}
                                placeholder="#1a3c34"
                                className="color-picker-input"
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
