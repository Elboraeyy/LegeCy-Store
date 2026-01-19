"use client";

import React from "react";

interface SpecRowProps {
    label: string;
    values: (string | undefined | null)[];
    highlightDiff?: boolean;
    // isHeader?: boolean;
}

export default function SpecRow({ label, values, highlightDiff = false }: SpecRowProps) {
    // Check if values are different (ignore empty/placeholders)
    const validValues = values.filter(v => v !== undefined && v !== null && v !== "");
    const isDifferent = validValues.length > 1 && new Set(validValues).size > 1;

    const shouldHighlight = highlightDiff && isDifferent;

    return (
        <tr style={{
            background: shouldHighlight ? "rgba(212, 175, 55, 0.08)" : "transparent", // Gold accent highlight
            transition: "background 0.3s ease"
        }}>
            <td className="specs-label sticky-col" style={{
                padding: "16px 24px",
                fontWeight: "600",
                color: "var(--text-muted)",
                width: "200px",
                minWidth: "200px",
                borderBottom: "1px solid var(--border)",
                verticalAlign: "top",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                background: shouldHighlight ? "rgba(212, 175, 55, 0.15)" : "#F5F0E3"
            }}>
                {label}
                {shouldHighlight && (
                    <span style={{
                        display: "inline-block",
                        marginLeft: "8px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--accent)"
                    }} title="Different across products" />
                )}
            </td>

            {values.map((val, idx) => (
                <td key={idx} style={{
                    padding: "16px 24px",
                    color: "var(--text)",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: "1px solid var(--border)",
                    verticalAlign: "top",
                    background: shouldHighlight ? "rgba(255,255,255,0.4)" : "transparent",
                    fontWeight: isDifferent ? "500" : "400",
                    fontSize: "14px",
                    lineHeight: "1.6"
                }}>
                    {val || "-"}
                </td>
            ))}
        </tr>
    );
}
