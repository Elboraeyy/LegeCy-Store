"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";

interface MobileComparisonViewProps {
    products: Product[];
    onRemove: (id: string | number) => void;
    onAddSlot: () => void;
    addToCart: (id: string) => void;
}

export default function MobileComparisonView({
    products,
    onRemove,
    onAddSlot,
    addToCart
}: MobileComparisonViewProps) {
    // State for selecting Primary and Secondary products
    const [primaryIdx, setPrimaryIdx] = useState(0);
    const [secondaryIdx, setSecondaryIdx] = useState(products.length > 1 ? 1 : 0);

    // State for accordion
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Basic Info": true,
        "Specifications": true
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const primary = products[primaryIdx];
    const secondary = products[secondaryIdx];

    // Spec groups (same as desktop)
    const specGroups = [
        {
            title: "Basic Info",
            rows: [
                { label: "Brand", key: "brand" },
                { label: "Collection", key: "category" },
                { label: "Status", key: "status" },
            ]
        },
        {
            title: "Specifications",
            rows: [
                { label: "Movement", specKey: "movement", default: "Quartz" },
                { label: "Case Material", specKey: "case", default: "Stainless Steel" },
                { label: "Water Resistance", specKey: "waterResistance", default: "3 ATM" },
                { label: "Glass Type", specKey: "glass", default: "Mineral" },
                { label: "Strap Material", key: "strap" },
            ]
        }
    ];

    const getSpecValue = (product: Product | undefined, row: { key?: string; specKey?: string; default?: string }) => {
        if (!product) return "-";
        if (row.key) {
            // @ts-expect-error - Dynamic property access
            return product[row.key] || row.default || "-";
        }
        if (row.specKey) {
            // @ts-expect-error - Dynamic property access
            return product.specs?.[row.specKey] || row.default || "-";
        }
        return "-";
    };

    const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

    return (
        <div style={{ padding: "0 16px 100px 16px" }}>
            {/* Product Thumbnails Row */}
            <div style={{
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                paddingBottom: "16px",
                marginBottom: "24px",
                WebkitOverflowScrolling: "touch"
            }} className="hide-scrollbar">
                {products.map((product, idx) => (
                    <div
                        key={product.id}
                        onClick={() => {
                            // Toggle between primary and secondary
                            if (primaryIdx !== idx && secondaryIdx !== idx) {
                                setSecondaryIdx(idx);
                            } else if (primaryIdx === idx) {
                                // Already primary, do nothing or cycle
                            } else {
                                // Swap primary and secondary
                                setPrimaryIdx(secondaryIdx);
                                setSecondaryIdx(primaryIdx);
                            }
                        }}
                        style={{
                            flexShrink: 0,
                            width: "80px",
                            position: "relative",
                            borderRadius: "12px",
                            border: primaryIdx === idx
                                ? "2px solid var(--primary)"
                                : secondaryIdx === idx
                                    ? "2px solid var(--accent)"
                                    : "1px solid var(--border)",
                            background: "var(--surface)",
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        {/* Selection Badge */}
                        {(primaryIdx === idx || secondaryIdx === idx) && (
                            <div style={{
                                position: "absolute",
                                top: "4px",
                                left: "4px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: primaryIdx === idx ? "var(--primary)" : "var(--accent)",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "10px",
                                fontWeight: "700",
                                zIndex: 2
                            }}>
                                {primaryIdx === idx ? "1" : "2"}
                            </div>
                        )}

                        {/* Remove Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(product.id);
                            }}
                            style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                background: "rgba(0,0,0,0.5)",
                                color: "#fff",
                                border: "none",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                zIndex: 2
                            }}
                        >
                            <X size={12} />
                        </button>

                        {/* Image */}
                        <div style={{ aspectRatio: "1/1", position: "relative" }}>
                            <Image
                                src={product.imageUrl || product.img || "/placeholder.jpg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                    </div>
                ))}

                {/* Add Product Button */}
                {products.length < 5 && (
                    <div
                        onClick={onAddSlot}
                        style={{
                            flexShrink: 0,
                            width: "80px",
                            aspectRatio: "1/1",
                            borderRadius: "12px",
                            border: "2px dashed var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            background: "transparent",
                            transition: "all 0.2s"
                        }}
                    >
                        <Plus size={24} color="var(--text-muted)" />
                    </div>
                )}
            </div>

            {/* Selected Products Header (Primary vs Secondary) */}
            {primary && secondary && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "24px"
                }}>
                    {/* Primary Product Card */}
                    <div style={{
                        background: "var(--surface)",
                        borderRadius: "12px",
                        padding: "12px",
                        border: "1px solid var(--primary)",
                        textAlign: "center"
                    }}>
                        <div style={{
                            width: "100%",
                            aspectRatio: "3/4",
                            position: "relative",
                            borderRadius: "8px",
                            overflow: "hidden",
                            marginBottom: "8px",
                            background: "var(--bg)"
                        }}>
                            <Image
                                src={primary.imageUrl || primary.img || "/placeholder.jpg"}
                                alt={primary.name}
                                fill
                                className="object-cover"
                                sizes="50vw"
                            />
                        </div>
                        <h3 style={{
                            fontSize: "13px",
                            fontFamily: "var(--font-heading)",
                            marginBottom: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}>
                            {primary.name}
                        </h3>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}>
                            {formatPrice(primary.price)}
                        </p>
                        <button
                            onClick={() => addToCart(String(primary.id))}
                            style={{
                                width: "100%",
                                marginTop: "8px",
                                padding: "8px",
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                background: "var(--primary)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "20px",
                                cursor: "pointer"
                            }}
                        >
                            Add to Cart
                        </button>
                    </div>

                    {/* Secondary Product Card */}
                    <div style={{
                        background: "var(--surface)",
                        borderRadius: "12px",
                        padding: "12px",
                        border: "1px solid var(--accent)",
                        textAlign: "center"
                    }}>
                        <div style={{
                            width: "100%",
                            aspectRatio: "3/4",
                            position: "relative",
                            borderRadius: "8px",
                            overflow: "hidden",
                            marginBottom: "8px",
                            background: "var(--bg)"
                        }}>
                            <Image
                                src={secondary.imageUrl || secondary.img || "/placeholder.jpg"}
                                alt={secondary.name}
                                fill
                                className="object-cover"
                                sizes="50vw"
                            />
                        </div>
                        <h3 style={{
                            fontSize: "13px",
                            fontFamily: "var(--font-heading)",
                            marginBottom: "4px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                        }}>
                            {secondary.name}
                        </h3>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}>
                            {formatPrice(secondary.price)}
                        </p>
                        <button
                            onClick={() => addToCart(String(secondary.id))}
                            style={{
                                width: "100%",
                                marginTop: "8px",
                                padding: "8px",
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                                background: "var(--primary)",
                                color: "#fff",
                                border: "none",
                                borderRadius: "20px",
                                cursor: "pointer"
                            }}
                        >
                            Add to Cart
                        </button>
                    </div>
                </div>
            )}

            {/* Accordion Spec Groups */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {specGroups.map((group) => (
                    <div key={group.title} style={{
                        background: "var(--surface)",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--border)"
                    }}>
                        {/* Accordion Header */}
                        <button
                            onClick={() => toggleSection(group.title)}
                            style={{
                                width: "100%",
                                padding: "16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "var(--font-heading)",
                                fontSize: "16px",
                                color: "var(--primary)",
                                fontWeight: "500"
                            }}
                        >
                            {group.title}
                            {openSections[group.title] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {/* Accordion Content */}
                        {openSections[group.title] && (
                            <div style={{ padding: "0 16px 16px 16px" }}>
                                {group.rows.map((row, rIdx) => {
                                    const primaryVal = getSpecValue(primary, row);
                                    const secondaryVal = getSpecValue(secondary, row);
                                    const isDifferent = primaryVal !== secondaryVal && primaryVal !== "-" && secondaryVal !== "-";

                                    return (
                                        <div
                                            key={rIdx}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr 1fr",
                                                gap: "8px",
                                                padding: "12px 0",
                                                borderBottom: rIdx < group.rows.length - 1 ? "1px solid var(--border)" : "none",
                                                background: isDifferent ? "rgba(212, 175, 55, 0.08)" : "transparent",
                                                marginLeft: "-16px",
                                                marginRight: "-16px",
                                                paddingLeft: "16px",
                                                paddingRight: "16px"
                                            }}
                                        >
                                            {/* Label */}
                                            <div style={{
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                color: "var(--text-muted)",
                                                textTransform: "uppercase",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px"
                                            }}>
                                                {row.label}
                                                {isDifferent && (
                                                    <span style={{
                                                        width: "6px",
                                                        height: "6px",
                                                        borderRadius: "50%",
                                                        background: "var(--accent)"
                                                    }} />
                                                )}
                                            </div>
                                            {/* Primary Value */}
                                            <div style={{
                                                fontSize: "13px",
                                                color: "var(--text)",
                                                textAlign: "center",
                                                fontWeight: isDifferent ? "600" : "400"
                                            }}>
                                                {primaryVal}
                                            </div>
                                            {/* Secondary Value */}
                                            <div style={{
                                                fontSize: "13px",
                                                color: "var(--text)",
                                                textAlign: "center",
                                                fontWeight: isDifferent ? "600" : "400"
                                            }}>
                                                {secondaryVal}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Floating Add Button (FAB) */}
            {products.length < 5 && (
                <button
                    onClick={onAddSlot}
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        color: "#fff",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 100
                    }}
                >
                    <Plus size={24} />
                </button>
            )}
        </div>
    );
}
