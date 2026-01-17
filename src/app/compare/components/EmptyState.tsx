"use client";

import React from "react";
import Link from "next/link";

interface EmptyStateProps {
    onStartShopping: () => void;
}

export default function EmptyState({ onStartShopping }: EmptyStateProps) {
    return (
        <div style={{
            padding: "80px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            minHeight: "50vh",
            marginTop: "20px"
        }}>
            <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
                color: "var(--accent)",
                border: "1px solid var(--border)"
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>

            <h2 style={{
                fontSize: "32px",
                fontWeight: "400",
                fontFamily: "var(--font-heading)",
                marginBottom: "16px",
                color: "var(--primary)"
            }}>
                Start Comparing
            </h2>
            <p style={{
                fontSize: "16px",
                color: "var(--text-muted)",
                maxWidth: "400px",
                marginBottom: "32px",
                lineHeight: "1.6"
            }}>
                Select products from the shop to see their specifications side by side.
            </p>

            <div style={{ display: "flex", gap: "16px" }}>
                <Link href="/shop" className="btn btn-primary">
                    Browse Collection
                </Link>
            </div>
        </div >
    );
}
