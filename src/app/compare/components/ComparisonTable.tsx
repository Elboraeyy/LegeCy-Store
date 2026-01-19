"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import AddProductSlot from "./AddProductSlot";
import SpecRow from "./SpecRow";

interface ComparisonTableProps {
    products: Product[];
    onRemove: (id: string | number) => void;
    onReplace: (id: string | number) => void;
    addToCart: (id: string) => void;
    onAddSlot: () => void;
}

export default function ComparisonTable({
    products,
    onRemove,
    onReplace,
    addToCart,
    onAddSlot,
}: ComparisonTableProps) {


    // Dynamic slots: Show all selected products + 1 empty slot (if less than 5)
    // This allows adding products one by one up to a max of 5
    const slots: (Product | null)[] = [...products];
    if (slots.length < 5) {
        slots.push(null);
    }

    // Groups of specs
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

    return (
        <div className="comparison-container">


            <div className="hide-scrollbar" style={{ overflowX: "auto", paddingBottom: "24px", marginLeft: "-24px", marginRight: "-24px", paddingLeft: "24px", paddingRight: "24px" }}>
                <table style={{ borderCollapse: "separate", borderSpacing: "0" }}>
                    <thead>
                        <tr>
                            <th className="specs-label sticky-col sticky-header" style={{
                                width: "200px",
                                minWidth: "200px",
                                padding: "24px",
                                textAlign: "left",
                                verticalAlign: "bottom",
                                background: "var(--bg)",
                                zIndex: 40
                            }}>
                                <h2 style={{
                                    fontSize: "28px",
                                    fontWeight: "400",
                                    fontFamily: "var(--font-heading)",
                                    color: "var(--primary)"
                                }}>
                                    Specs
                                </h2>
                            </th>
                            {slots.map((product, idx) => (
                                <th key={product ? product.id : `slot-${idx}`} className="product-col sticky-header" style={{
                                    width: "300px",
                                    minWidth: "300px",
                                    maxWidth: "300px",
                                    padding: "0 12px 24px 12px",
                                    verticalAlign: "top",
                                    position: "relative",
                                    height: "1px",
                                    background: "var(--bg)",
                                    zIndex: 20
                                }}>
                                    {product ? (
                                        <ProductCard
                                            product={product}
                                            onRemove={onRemove}
                                            onReplace={onReplace}
                                            addToCart={addToCart}
                                        />
                                    ) : (
                                        <AddProductSlot
                                                onAdd={onAddSlot}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {specGroups.map((group, gIdx) => (
                            <React.Fragment key={gIdx}>
                                {/* Group Header */}
                                <tr>
                                    <td className="sticky-col" style={{
                                        padding: "32px 24px 16px 24px",
                                        fontSize: "16px",
                                        fontFamily: "var(--font-heading)",
                                        fontWeight: "400",
                                        color: "var(--primary)",
                                        borderBottom: "1px solid var(--accent)",
                                        background: "var(--bg)",
                                        width: "200px",
                                        minWidth: "200px"
                                    }}>
                                        {group.title}
                                    </td>
                                    {slots.map((_, idx) => (
                                        <td key={idx} style={{
                                            borderBottom: "1px solid var(--accent)",
                                            background: "var(--bg)"
                                        }}></td>
                                    ))}
                                </tr>
                                {/* Rows */}
                                {group.rows.map((row, rIdx) => {
                                    const values = slots.map(p => {
                                        if (!p) return "";
                                        if ('key' in row && row.key) {
                                            // @ts-expect-error - Dynamic property access
                                            return p[row.key] || row.default || "-";
                                        }
                                        if ('specKey' in row && row.specKey) {
                                            // @ts-expect-error - Dynamic property access
                                            return p.specs?.[row.specKey] || row.default || "-";
                                        }
                                        return "-";
                                    });

                                    return (
                                        <SpecRow
                                            key={rIdx}
                                            label={row.label}
                                            values={values}
                                            highlightDiff={true}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
