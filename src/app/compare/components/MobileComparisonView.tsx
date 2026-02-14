"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, getLocalized } from "@/types/product";
import { motion, PanInfo } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
    const { t, language } = useLanguage();

    // State for selecting Primary and Secondary products
    const [primaryIdx, setPrimaryIdx] = useState(0);
    const [secondaryIdx, setSecondaryIdx] = useState(products.length > 1 ? 1 : 0);

    // State for accordion
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Basic Info": true,
        "Specifications": true
    });

    const labelFor = (key: string) => {
        switch (key) {
            case "dialSize": return t.compare.labels.dial_size;
            case "dialColor": return t.compare.labels.dial_color;
            case "case": return t.compare.labels.case;
            case "caseColor": return t.compare.labels.case_color;
            case "strapMaterial": return t.compare.labels.strap_material;
            case "strapColor": return t.compare.labels.strap_color;
            case "strapWidth": return t.compare.labels.strap_width;
            case "movement": return t.compare.labels.movement;
            case "waterResistance": return t.compare.labels.water_resistance;
            case "hourMarkers": return t.compare.labels.hour_markers;
            case "glass": return t.product.glass;
            default: {
                const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
                return spaced.charAt(0).toUpperCase() + spaced.slice(1);
            }
        }
    };

    const preferredOrder = [
        "dialSize",
        "dialColor",
        "case",
        "caseColor",
        "strapMaterial",
        "strapColor",
        "strapWidth",
        "movement",
        "glass",
        "waterResistance",
        "hourMarkers"
    ];

    const isInStock = (p: Product | null | undefined) => {
        if (!p) return false;
        if (typeof p.totalStock === 'number') return p.totalStock > 0;
        const v: unknown = (p as unknown as { variants?: { stock?: number }[] }).variants;
        if (Array.isArray(v)) {
            const sum = v.reduce((acc, it) => acc + (it?.stock || 0), 0);
            if (sum > 0) return true;
        }
        // Fallback if backend provided boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((p as any).inStock !== undefined) return Boolean((p as any).inStock);
        return false;
    };

    const specKeysSet = new Set<string>();
    products.forEach(p => {
        const s = p?.specs || {};
        Object.keys(s).forEach(k => {
            if (s[k as keyof typeof s]) specKeysSet.add(k);
        });
    });
    const dynamicSpecKeys = Array.from(specKeysSet);
    const orderedSpecKeys = [
        ...preferredOrder.filter(k => dynamicSpecKeys.includes(k)),
        ...dynamicSpecKeys.filter(k => !preferredOrder.includes(k)).sort()
    ];

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const primary = products[primaryIdx];
    const secondary = products[secondaryIdx];

    const specGroups = [
        {
            title: t.compare.basic_info,
            id: "Basic Info",
            rows: [
                { label: t.compare.labels.brand, key: "brand" },
                { label: t.compare.labels.category, key: "category" },
                { label: t.compare.labels.status, key: "status" },
            ]
        },
        {
            title: t.compare.specifications,
            id: "Specifications",
            rows: orderedSpecKeys.map(k => ({ label: labelFor(k), specKey: k }))
        }
    ];

    const normalizeDisplay = (v: string | undefined | null) => (v ?? "").toString().trim().replace(/\s+/g, " ");

    const getSpecValue = (product: Product | undefined, row: { key?: string; specKey?: string; default?: string }) => {
        if (!product) return "-";
        if (row.key) {
            if (row.key === "status") {
                return isInStock(product) ? t.product.in_stock : t.product.out_of_stock;
            }
            if (row.key === "brand" || row.key === "category") {
                return normalizeDisplay(getLocalized(product, language, row.key) || row.default || "-");
            }
            // @ts-expect-error - Dynamic property access
            return normalizeDisplay(product[row.key] || row.default || "-");
        }
        if (row.specKey) {
            // @ts-expect-error - Dynamic property access
            return normalizeDisplay(product.specs?.[row.specKey] || row.default || "-");
        }
        return "-";
    };

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(p);
    };

    return (
        <div style={{ padding: "0 16px 100px 16px" }}>
            {/* Product Thumbnails Row */}
            <div style={{
                display: "flex",
                gap: "12px",
                overflowX: "auto",
                paddingBottom: "16px",
                marginBottom: "24px",
                marginLeft: "-28px",  // Pull to edge
                marginRight: "-28px", // Pull to edge
                paddingLeft: "16px",  // Restore start spacing
                paddingRight: "16px", // Restore end spacing
                WebkitOverflowScrolling: "touch"
            }} className="hide-scrollbar">
                {products.map((product, idx) => (
                    <motion.div
                        key={product.id}
                        drag
                        dragDirectionLock
                        dragSnapToOrigin
                        dragElastic={0.2}
                        whileDrag={{ scale: 1.1, zIndex: 100 }}
                        onDragEnd={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                            const { x, y } = info.point;
                            // Check if dropped below the thumbnail row (approx > 250px from top)
                            // and determine side based on screen width
                            if (y > 250) {
                                const isLeft = x < window.innerWidth / 2;
                                if (isLeft) {
                                    setPrimaryIdx(idx);
                                } else {
                                    setSecondaryIdx(idx);
                                }
                            }
                        }}
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
                            touchAction: "pan-x" // Allow horizontal scroll (browser), Drag handles Vertical
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
                            onPointerDownCapture={(e) => e.stopPropagation()} // Prevent drag start when clicking remove
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
                        <div style={{ aspectRatio: "1/1", position: "relative", pointerEvents: "none" }}>
                            <Image
                                src={product.imageUrl || product.img || "/placeholder.jpg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                    </motion.div>
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
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%"
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
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "36px", // Force 2 lines height
                            lineHeight: "1.4"
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
                                marginTop: "auto",
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
                            {t.common.addToCart}
                        </button>
                    </div>

                    {/* Secondary Product Card */}
                    <div style={{
                        background: "var(--surface)",
                        borderRadius: "12px",
                        padding: "12px",
                        border: "1px solid var(--accent)",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%"
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
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "36px", // Force 2 lines height
                            lineHeight: "1.4"
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
                                marginTop: "auto",
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
                            {t.common.addToCart}
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
                            onClick={() => toggleSection(group.id)}
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
                            {openSections[group.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {/* Accordion Content */}
                        {openSections[group.id] && (
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
