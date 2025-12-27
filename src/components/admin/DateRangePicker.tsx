'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { DateRange } from '@/lib/actions/analytics';

interface DateRangePickerProps {
    currentRange: DateRange;
    customStart?: string;
    customEnd?: string;
}

const rangeOptions: { value: DateRange; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom Range' }
];

export default function DateRangePicker({ currentRange, customStart, customEnd }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomInputs, setShowCustomInputs] = useState(currentRange === 'custom');
    const [startDate, setStartDate] = useState(customStart || '');
    const [endDate, setEndDate] = useState(customEnd || '');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Get display label
    const getDisplayLabel = () => {
        if (currentRange === 'custom' && customStart && customEnd) {
            const start = new Date(customStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const end = new Date(customEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return `${start} - ${end}`;
        }
        return rangeOptions.find(r => r.value === currentRange)?.label || 'Last 30 Days';
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCustomInputs(currentRange === 'custom');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [currentRange]);

    const handleSelect = (value: DateRange) => {
        if (value === 'custom') {
            setShowCustomInputs(true);
            return;
        }
        setIsOpen(false);
        setShowCustomInputs(false);
        router.push(`/admin/analytics?range=${value}`);
    };

    const handleApplyCustom = () => {
        if (startDate && endDate) {
            setIsOpen(false);
            router.push(`/admin/analytics?range=custom&start=${startDate}&end=${endDate}`);
        }
    };

    // Set default dates for custom (last 30 days)
    const handleOpenCustom = () => {
        if (!startDate) {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        }
        setShowCustomInputs(true);
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '99px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                className="date-picker-trigger"
            >
                <span style={{ fontSize: '16px' }}>📅</span>
                <span>{getDisplayLabel()}</span>
                <span style={{ 
                    fontSize: '10px', 
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>▼</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '1px solid #e5e5e5',
                        overflow: 'hidden',
                        zIndex: 100,
                        minWidth: showCustomInputs ? '280px' : '180px',
                        animation: 'fadeIn 0.15s ease'
                    }}
                >
                    {/* Preset Options */}
                    {rangeOptions.filter(o => o.value !== 'custom').map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleSelect(option.value)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                padding: '12px 16px',
                                background: currentRange === option.value ? '#f8f8f8' : 'transparent',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: currentRange === option.value ? 600 : 400,
                                color: currentRange === option.value ? '#1a3c34' : '#555',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = currentRange === option.value ? '#f8f8f8' : 'transparent';
                            }}
                        >
                            {currentRange === option.value && (
                                <span style={{ color: '#1a3c34' }}>✓</span>
                            )}
                            <span style={{ marginLeft: currentRange === option.value ? 0 : '24px' }}>
                                {option.label}
                            </span>
                        </button>
                    ))}

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#eee', margin: '4px 0' }} />

                    {/* Custom Range Option */}
                    <button
                        onClick={handleOpenCustom}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '12px 16px',
                            background: currentRange === 'custom' || showCustomInputs ? '#f8f8f8' : 'transparent',
                            border: 'none',
                            fontSize: '13px',
                            fontWeight: currentRange === 'custom' || showCustomInputs ? 600 : 400,
                            color: currentRange === 'custom' || showCustomInputs ? '#1a3c34' : '#555',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = (currentRange === 'custom' || showCustomInputs) ? '#f8f8f8' : 'transparent';
                        }}
                    >
                        {(currentRange === 'custom' || showCustomInputs) && (
                            <span style={{ color: '#1a3c34' }}>✓</span>
                        )}
                        <span style={{ marginLeft: (currentRange === 'custom' || showCustomInputs) ? 0 : '24px' }}>
                            📆 Custom Range
                        </span>
                    </button>

                    {/* Custom Date Inputs */}
                    {showCustomInputs && (
                        <div style={{ padding: '16px', borderTop: '1px solid #eee', background: '#fafafa' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '13px'
                                    }}
                                    max={endDate || undefined}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        fontSize: '13px'
                                    }}
                                    min={startDate || undefined}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                            <button
                                onClick={handleApplyCustom}
                                disabled={!startDate || !endDate}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    background: startDate && endDate ? '#1a3c34' : '#ccc',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s'
                                }}
                            >
                                Apply Range
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .date-picker-trigger:hover {
                    border-color: #1a3c34;
                }
            `}</style>
        </div>
    );
}
