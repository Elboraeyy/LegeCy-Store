"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";

interface PriceRangeSliderProps {
    min: number;
    max: number;
    value: { min: number; max: number };
    onChange: (range: { min: number; max: number }) => void;
    className?: string;
}

export default function PriceRangeSlider({
    min,
    max,
    value,
    onChange,
    className = "",
}: PriceRangeSliderProps) {
    const [isDragging, setIsDragging] = useState<"min" | "max" | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const minThumbRef = useRef<HTMLDivElement>(null);
    const maxThumbRef = useRef<HTMLDivElement>(null);

    const getPercentage = useCallback(
        (val: number) => ((val - min) / (max - min)) * 100,
        [min, max]
    );

    const getValueFromPercentage = useCallback(
        (percentage: number) => {
            const val = min + (percentage / 100) * (max - min);
            return Math.round(val);
        },
        [min, max]
    );

    const handleMouseDown = useCallback(
        (type: "min" | "max") => (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(type);
        },
        []
    );

    const handleTouchStart = useCallback(
        (type: "min" | "max") => (e: React.TouchEvent) => {
            e.preventDefault();
            setIsDragging(type);
        },
        []
    );

    const updateValue = useCallback(
        (clientX: number) => {
            if (!sliderRef.current || !isDragging) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const percentage = Math.max(
                0,
                Math.min(100, ((clientX - rect.left) / rect.width) * 100)
            );
            const newValue = getValueFromPercentage(percentage);

            if (isDragging === "min") {
                const clampedValue = Math.max(min, Math.min(newValue, value.max - 1));
                onChange({ ...value, min: clampedValue });
            } else {
                const clampedValue = Math.min(max, Math.max(newValue, value.min + 1));
                onChange({ ...value, max: clampedValue });
            }
        },
        [isDragging, value, min, max, onChange, getValueFromPercentage]
    );

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            updateValue(e.clientX);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                updateValue(e.touches[0].clientX);
            }
        };

        const handleMouseUp = () => {
            setIsDragging(null);
        };

        const handleTouchEnd = () => {
            setIsDragging(null);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [isDragging, updateValue]);

    const handleTrackClick = useCallback(
        (e: React.MouseEvent) => {
            if (isDragging) return;

            const target = e.target as HTMLElement;
            if (
                target === minThumbRef.current ||
                target === maxThumbRef.current ||
                minThumbRef.current?.contains(target) ||
                maxThumbRef.current?.contains(target)
            ) {
                return;
            }

            if (!sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
            const clickedValue = getValueFromPercentage(percentage);

            const distanceToMin = Math.abs(clickedValue - value.min);
            const distanceToMax = Math.abs(clickedValue - value.max);

            if (distanceToMin < distanceToMax) {
                const clampedValue = Math.max(min, Math.min(clickedValue, value.max - 1));
                onChange({ ...value, min: clampedValue });
            } else {
                const clampedValue = Math.min(max, Math.max(clickedValue, value.min + 1));
                onChange({ ...value, max: clampedValue });
            }
        },
        [value, min, max, onChange, getValueFromPercentage, isDragging]
    );

    const handleKeyDown = useCallback(
        (type: "min" | "max") => (e: React.KeyboardEvent) => {
            const step = Math.ceil((max - min) / 100);
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                if (type === "min") {
                    const newValue = Math.max(min, value.min - step);
                    onChange({ ...value, min: Math.min(newValue, value.max - 1) });
                } else {
                    const newValue = Math.max(value.min + 1, value.max - step);
                    onChange({ ...value, max: newValue });
                }
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                if (type === "min") {
                    const newValue = Math.min(value.max - 1, value.min + step);
                    onChange({ ...value, min: newValue });
                } else {
                    const newValue = Math.min(max, value.max + step);
                    onChange({ ...value, max: newValue });
                }
            }
        },
        [value, min, max, onChange]
    );

    const minPercentage = getPercentage(value.min);
    const maxPercentage = getPercentage(value.max);

    return (
        <div className={`w-full ${className}`}>
            {/* Slider Track */}
            <div
                ref={sliderRef}
                className="relative h-1.5 bg-gray-100 rounded-full cursor-pointer mb-6"
                onClick={handleTrackClick}
            >
                {/* Active Range */}
                <div
                    className="absolute h-1.5 bg-gradient-to-r from-[#12403C] via-[#12403C] to-[#d4af37] rounded-full transition-all duration-200 ease-out"
                    style={{
                        left: `${minPercentage}%`,
                        width: `${maxPercentage - minPercentage}%`,
                    }}
                />

                {/* Min Thumb */}
                <div
                    ref={minThumbRef}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging === "min"
                        ? "scale-125 border-[#d4af37] shadow-lg"
                        : "border-[#12403C] hover:scale-110 hover:shadow-lg"
                        } focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2`}
                    style={{ left: `${minPercentage}%` }}
                    onMouseDown={handleMouseDown("min")}
                    onTouchStart={handleTouchStart("min")}
                    onKeyDown={handleKeyDown("min")}
                    role="slider"
                    aria-valuemin={min}
                    aria-valuemax={value.max - 1}
                    aria-valuenow={value.min}
                    tabIndex={0}
                />

                {/* Max Thumb */}
                <div
                    ref={maxThumbRef}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 ${isDragging === "max"
                        ? "scale-125 border-[#d4af37] shadow-lg"
                        : "border-[#12403C] hover:scale-110 hover:shadow-lg"
                        } focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2`}
                    style={{ left: `${maxPercentage}%` }}
                    onMouseDown={handleMouseDown("max")}
                    onTouchStart={handleTouchStart("max")}
                    onKeyDown={handleKeyDown("max")}
                    role="slider"
                    aria-valuemin={value.min + 1}
                    aria-valuemax={max}
                    aria-valuenow={value.max}
                    tabIndex={0}
                />
            </div>
        </div>
    );
}
