"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";

interface ProductCardProps {
    product: Product;
    onRemove: (id: string | number) => void;
    onReplace: (id: string | number) => void;
    addToCart: (id: string) => void;
}

export default function ProductCard({ product, onRemove, onReplace, addToCart }: ProductCardProps) {
    const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

    return (
        <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "16px",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "var(--shadow)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
            }}
        >
            {/* Image Area */}
            <Link href={`/product/${product.id}`} style={{ display: "block", marginBottom: "16px" }}>
                <div style={{
                    position: "relative",
                    aspectRatio: "3/4",
                    width: "100%",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    background: "var(--bg)",
                    marginBottom: "12px"
                }}>
                    <Image
                        src={product.imageUrl || product.img || '/placeholder.jpg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 20vw"
                    />
                </div>
            </Link>

            {/* Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{
                    fontSize: "16px",
                    fontFamily: "var(--font-heading)",
                    lineHeight: "1.4",
                    marginBottom: "8px",
                    height: "44px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    color: "var(--text)"
                }}>
                    <Link href={`/product/${product.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {product.name}
                    </Link>
                </h3>

                <div style={{ marginBottom: "16px" }}>
                    <p style={{ fontSize: "18px", fontWeight: "600", color: "var(--primary)", fontFamily: "var(--font-body)" }}>
                        {formatPrice(product.price)}
                    </p>
                    {product.compareAtPrice && (
                        <p style={{ fontSize: "12px", textDecoration: "line-through", color: "var(--text-muted)" }}>
                            {formatPrice(product.compareAtPrice)}
                        </p>
                    )}
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <button
                        onClick={() => onReplace(product.id)}
                        style={{
                            flex: 1,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                            padding: "8px",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "25px",
                            color: "var(--text-muted)",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "var(--primary)";
                            e.currentTarget.style.color = "var(--primary)";
                            e.currentTarget.style.background = "var(--bg)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.color = "var(--text-muted)";
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6"></path>
                            <path d="M1 20v-6h6"></path>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                        Change
                    </button>
                    <button
                        onClick={() => onRemove(product.id)}
                        style={{
                            flex: 1,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                            padding: "8px",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "25px",
                            color: "#ef4444",
                            fontSize: "12px",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = "#ef4444";
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = "var(--border)";
                            e.currentTarget.style.background = "transparent";
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Remove
                    </button>
                </div>

                <button
                    onClick={() => addToCart(String(product.id))}
                    style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "12px",
                        borderRadius: "25px",
                        marginTop: "auto",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        background: "var(--primary)",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
