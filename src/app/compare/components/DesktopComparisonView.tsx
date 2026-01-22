"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Product } from "@/types/product";

interface DesktopComparisonViewProps {
    products: Product[];
    onRemove: (id: string | number) => void;
    onReplace: (id: string | number) => void;
    addToCart: (id: string) => void;
    onAddSlot: () => void;
}

export default function DesktopComparisonView({
    products,
    onRemove,
    addToCart,
    onAddSlot
}: DesktopComparisonViewProps) {
    // State for selecting 3 slots (indices in the products array)
    const [slot1Idx, setSlot1Idx] = useState<number | null>(0);
    const [slot2Idx, setSlot2Idx] = useState<number | null>(products.length > 1 ? 1 : null);
    const [slot3Idx, setSlot3Idx] = useState<number | null>(products.length > 2 ? 2 : null);

    // Sync slots when products array changes (e.g. removed item)
    useEffect(() => {
        // Simple re-validation to ensure indices are valid
        if (slot1Idx !== null && slot1Idx >= products.length) setSlot1Idx(null);
        if (slot2Idx !== null && slot2Idx >= products.length) setSlot2Idx(null);
        if (slot3Idx !== null && slot3Idx >= products.length) setSlot3Idx(null);

        // Auto-fill empty slots if new products available
        // logic similar to mobile: if I have a slot open and products available that aren't used, fill it.
        const usedIndices = new Set([slot1Idx, slot2Idx, slot3Idx].filter(i => i !== null) as number[]);

        let nextCandidate = 0;
        const findNext = () => {
            while (nextCandidate < products.length) {
                if (!usedIndices.has(nextCandidate)) {
                    usedIndices.add(nextCandidate);
                    return nextCandidate;
                }
                nextCandidate++;
            }
            return null;
        };

        if (slot1Idx === null) { const fill = findNext(); if (fill !== null) setSlot1Idx(fill); }
        if (slot2Idx === null) { const fill = findNext(); if (fill !== null) setSlot2Idx(fill); }
        if (slot3Idx === null) { const fill = findNext(); if (fill !== null) setSlot3Idx(fill); }

    }, [products.length, slot1Idx, slot2Idx, slot3Idx]);


    // State for accordion
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Basic Info": true,
        "Specifications": true
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const slot1 = slot1Idx !== null ? products[slot1Idx] : null;
    const slot2 = slot2Idx !== null ? products[slot2Idx] : null;
    const slot3 = slot3Idx !== null ? products[slot3Idx] : null;

    // Spec groups
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

    const getSpecValue = (product: Product | undefined | null, row: { key?: string; specKey?: string; default?: string }) => {
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

    const handleThumbnailClick = (idx: number) => {
        // Logic:
        // If idx is already in a slot, do nothing? or maybe flash it.
        // If not in a slot, put it in the "first available" or "last interacted" slot? 
        // Mobile behavior: 
        // "Toggle between primary and secondary". 
        // Logic there was: If neither, put in secondary. If primary, do nothing. If secondary, swap?

        // For 3 slots, simple rotation or "First Empty -> Then Replace Slot 3 -> Then Slot 2..."?
        // Let's go with: Replace first empty. If full, replace the last one (Slot 3) or shift?
        // User asked for "Same experience". 
        // Mobile: "If P!=idx && S!=idx -> setSecondary(idx)". 

        if (slot1Idx === idx || slot2Idx === idx || slot3Idx === idx) return;

        if (slot1Idx === null) { setSlot1Idx(idx); return; }
        if (slot2Idx === null) { setSlot2Idx(idx); return; }
        if (slot3Idx === null) { setSlot3Idx(idx); return; }

        // If full, replace Slot 3 (arbitrary choice to cycle)
        setSlot3Idx(idx);
    };

    const onDropHandler = (droppedIdx: number, targetSlot: 1 | 2 | 3) => {
        // If droppedIdx is already in a slot, swap it? 
        // Example: Drag Slot1 Item to Slot2. 
        // But here we drag from "Thumbnails" to "Slots".

        // If droppedIdx is already in Slot X, and we drop on Slot Y:
        // Swap Slot X and Slot Y.

        let currentSlotOfDropped = -1;
        if (slot1Idx === droppedIdx) currentSlotOfDropped = 1;
        if (slot2Idx === droppedIdx) currentSlotOfDropped = 2;
        if (slot3Idx === droppedIdx) currentSlotOfDropped = 3;

        if (currentSlotOfDropped !== -1) {
            // Swap
            if (currentSlotOfDropped === targetSlot) return; // Same slot

            // Perform swap
            const targetIdx = targetSlot === 1 ? slot1Idx : targetSlot === 2 ? slot2Idx : slot3Idx;

            // Set source slot to target's content
            if (currentSlotOfDropped === 1) setSlot1Idx(targetIdx);
            if (currentSlotOfDropped === 2) setSlot2Idx(targetIdx);
            if (currentSlotOfDropped === 3) setSlot3Idx(targetIdx);

            // Set target slot to dropped content
            if (targetSlot === 1) setSlot1Idx(droppedIdx);
            if (targetSlot === 2) setSlot2Idx(droppedIdx);
            if (targetSlot === 3) setSlot3Idx(droppedIdx);

        } else {
            // New item dropped into slot
            if (targetSlot === 1) setSlot1Idx(droppedIdx);
            if (targetSlot === 2) setSlot2Idx(droppedIdx);
            if (targetSlot === 3) setSlot3Idx(droppedIdx);
        }
    };

    return (
        <div className="container mx-auto pb-24 px-4 md:px-8">
            {/* Product Thumbnails Row */}
            <div style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                paddingBottom: "24px",
                marginBottom: "32px",
                justifyContent: "center" // Center on desktop usually looks better
            }} className="hide-scrollbar">
                {products.map((product, idx) => {
                    // Determine which slot, if any
                    let badgeLabel = null;
                    let borderColor = "var(--border)";
                    let badgeColor = "var(--text-muted)";

                    if (slot1Idx === idx) { badgeLabel = "1"; borderColor = "var(--primary)"; badgeColor = "var(--primary)"; }
                    else if (slot2Idx === idx) { badgeLabel = "2"; borderColor = "var(--accent)"; badgeColor = "var(--accent)"; }
                    else if (slot3Idx === idx) { badgeLabel = "3"; borderColor = "#2563eb"; badgeColor = "#2563eb"; } // Blue for 3rd

                    return (
                        <ThumbnailCard
                            key={product.id}
                            product={product}
                            idx={idx}
                            borderColor={borderColor}
                            badgeLabel={badgeLabel}
                            badgeColor={badgeColor}
                            onClick={() => handleThumbnailClick(idx)}
                            onRemove={() => onRemove(product.id)}
                            onDrop={onDropHandler}
                        />
                    );
                })}

                {/* Add Product Button */}
                {products.length < 10 && (
                    <button
                        onClick={onAddSlot}
                        style={{
                            flexShrink: 0,
                            width: "100px",
                            height: "100px",
                            borderRadius: "16px",
                            border: "2px dashed var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", background: "transparent",
                            transition: "all 0.2s"
                        }}
                        className="hover:bg-[var(--surface)]"
                    >
                        <Plus size={32} color="var(--text-muted)" />
                    </button>
                )}
            </div>

            {/* Selected Products Grid (3 Slots) */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "150px repeat(3, 1fr)",
                gap: "24px",
                marginBottom: "40px",
                maxWidth: "1000px",
                margin: "0 auto 40px auto"
            }}>
                {/* Spacer for Label Column Alignment */}
                <div className="hidden md:block"></div>

                {[
                    { idx: slot1Idx, product: slot1, slotNum: 1, borderColor: "var(--primary)" },
                    { idx: slot2Idx, product: slot2, slotNum: 2, borderColor: "var(--accent)" },
                    { idx: slot3Idx, product: slot3, slotNum: 3, borderColor: "#2563eb" } // Blue for 3rd
                ].map((slot) => (
                    <div
                        key={slot.slotNum}
                        // Drop Zone
                        data-slot-num={slot.slotNum}
                        style={{
                            background: "var(--surface)",
                            borderRadius: "16px",
                            padding: "24px",
                            border: `2px solid ${slot.borderColor}`,
                            textAlign: "center",
                            minHeight: "350px",
                            display: "flex", flexDirection: "column"
                        }}
                    >
                        {slot.product ? (
                            <>
                                <div style={{
                                    width: "100%", aspectRatio: "3/4", position: "relative",
                                    borderRadius: "12px", overflow: "hidden", marginBottom: "16px",
                                    background: "var(--bg)"
                                }}>
                                    <Image
                                        src={slot.product?.imageUrl || slot.product?.img || "/placeholder.jpg"}
                                        alt={slot.product?.name || "Product"}
                                        fill
                                        className="object-cover"
                                        sizes="300px"
                                    />
                                    {/* Clear Slot Button */}
                                    <button
                                        onClick={() => {
                                            if (slot.slotNum === 1) setSlot1Idx(null);
                                            if (slot.slotNum === 2) setSlot2Idx(null);
                                            if (slot.slotNum === 3) setSlot3Idx(null);
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <h3 style={{
                                    fontSize: "18px", fontFamily: "var(--font-heading)",
                                    marginBottom: "8px", color: "var(--text)",
                                    height: "50px", overflow: "hidden", display: "-webkit-box",
                                    WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                                }}>
                                    {slot.product?.name}
                                </h3>
                                <p style={{ fontSize: "18px", fontWeight: "600", color: "var(--primary)", marginTop: "auto" }}>
                                    {slot.product ? formatPrice(slot.product.price) : "-"}
                                </p>
                                <button
                                    onClick={() => slot.product && addToCart(String(slot.product.id))}
                                    style={{
                                        width: "100%", marginTop: "16px", padding: "12px",
                                        fontSize: "13px", fontWeight: "600", textTransform: "uppercase",
                                        background: "var(--primary)", color: "#fff", border: "none",
                                        borderRadius: "30px", cursor: "pointer"
                                    }}
                                    className="hover:opacity-90 transition-opacity"
                                >
                                    Add to Cart
                                </button>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] cursor-pointer hover:bg-[var(--bg)] rounded-xl transition-colors p-4" onClick={onAddSlot}>
                                <div className="w-16 h-16 rounded-full bg-[var(--bg)] flex items-center justify-center mb-4">
                                    <Plus size={32} />
                                </div>
                                <span className="font-medium text-lg">Add to Slot {slot.slotNum}</span>
                                <span className="text-sm opacity-70 mt-2">or drag a product here</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Accordion Spec Groups */}
            <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
                {specGroups.map((group) => (
                    <div key={group.title} style={{
                        background: "var(--surface)",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "1px solid var(--border)"
                    }}>
                        {/* Accordion Header */}
                        <button
                            onClick={() => toggleSection(group.title)}
                            style={{
                                width: "100%", padding: "24px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                background: "transparent", border: "none", cursor: "pointer",
                                fontFamily: "var(--font-heading)", fontSize: "20px",
                                color: "var(--primary)", fontWeight: "500"
                            }}
                        >
                            {group.title}
                            {openSections[group.title] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </button>

                        {/* Accordion Content */}
                        {openSections[group.title] && (
                            <div style={{ padding: "0 24px 24px 24px" }}>
                                {group.rows.map((row, rIdx) => {
                                    const val1 = getSpecValue(slot1, row);
                                    const val2 = getSpecValue(slot2, row);
                                    const val3 = getSpecValue(slot3, row);

                                    // Simple logic for desktop diff: highlight if any difference exists among active non-nulls
                                    const activeVals = [val1, val2, val3].filter(v => v !== "-" && (slot1 || slot2 || slot3));
                                    const isDifferent = activeVals.length > 1 && new Set(activeVals).size > 1;

                                    return (
                                        <div
                                            key={rIdx}
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "150px 1fr 1fr 1fr",
                                                gap: "24px",
                                                padding: "16px 0",
                                                borderBottom: rIdx < group.rows.length - 1 ? "1px solid var(--border)" : "none",
                                                background: isDifferent ? "rgba(212, 175, 55, 0.05)" : "transparent",
                                                margin: "0 -24px",
                                                paddingLeft: "24px", paddingRight: "24px"
                                            }}
                                        >
                                            {/* Label */}
                                            <div style={{
                                                fontSize: "13px", fontWeight: "700", color: "var(--text-muted)",
                                                textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px"
                                            }}>
                                                {row.label}
                                                {isDifferent && (
                                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)" }} />
                                                )}
                                            </div>

                                            {/* Values */}
                                            <div style={{ fontSize: "15px", color: "var(--text)", textAlign: "center", fontWeight: isDifferent && slot1 ? "600" : "400" }}>{val1}</div>
                                            <div style={{ fontSize: "15px", color: "var(--text)", textAlign: "center", fontWeight: isDifferent && slot2 ? "600" : "400" }}>{val2}</div>
                                            <div style={{ fontSize: "15px", color: "var(--text)", textAlign: "center", fontWeight: isDifferent && slot3 ? "600" : "400" }}>{val3}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                    </div>
                ))}
            </div>

        </div>
    );
}

// Reusing the drag thumbnail logic
interface ThumbnailCardProps {
    product: Product;
    idx: number;
    borderColor: string;
    badgeLabel: string | null;
    badgeColor: string;
    onClick: () => void;
    onRemove: () => void;
    onDrop: (idx: number, slotNum: 1 | 2 | 3) => void;
}

function ThumbnailCard({ product, idx, borderColor, badgeLabel, badgeColor, onClick, onRemove, onDrop }: ThumbnailCardProps) {
    return (
        <motion.div
            drag
            dragSnapToOrigin
            dragElastic={0.2}
            whileDrag={{ scale: 1.1, zIndex: 100, cursor: "grabbing" }}
            onDragEnd={(_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
                const { x, y } = info.point;
                const elements = document.elementsFromPoint(x, y);
                // Find element with data-slot-num
                const dropSlot = elements.find(el => el.hasAttribute("data-slot-num"));
                if (dropSlot) {
                    const slotNum = parseInt(dropSlot.getAttribute("data-slot-num") || "0");
                    if (slotNum >= 1 && slotNum <= 3) {
                        onDrop(idx, slotNum as 1 | 2 | 3);
                    }
                }
            }}
            onClick={onClick}
            style={{
                flexShrink: 0,
                width: "100px",
                position: "relative",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                background: "var(--surface)",
                overflow: "hidden",
                cursor: "pointer",
                touchAction: "none"
            }}
            className="hover:shadow-md transition-shadow"
        >
            {/* Badge */}
            {badgeLabel && (
                <div style={{
                    position: "absolute", top: "6px", left: "6px",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: badgeColor, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700", zIndex: 2
                }}>
                    {badgeLabel}
                </div>
            )}

            {/* Remove */}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                onPointerDownCapture={(e) => e.stopPropagation()}
                style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: "rgba(0,0,0,0.5)", color: "#fff", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", zIndex: 2
                }}
            >
                <X size={14} />
            </button>

            {/* Image */}
            <div style={{ aspectRatio: "1/1", position: "relative", pointerEvents: "none" }}>
                <Image
                    src={product.imageUrl || product.img || "/placeholder.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="100px"
                />
            </div>
        </motion.div>
    );
}
