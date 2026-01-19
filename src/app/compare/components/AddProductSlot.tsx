"use client";

// import Image from "next/image"; // Unused
// import { Product } from "@/types/product"; // Unused
// import { useComparison } from "@/context/ComparisonContext"; // Unused

interface AddProductSlotProps {
    onAdd: () => void;
    // suggestion?: Product; // Unused
}

export default function AddProductSlot({ onAdd }: AddProductSlotProps) {
    // const { addToCompare } = useComparison(); // Unused

    // const handleQuickAdd ... removed unused

    return (
        <div
            onClick={onAdd}
            style={{
                height: "100%",
                minHeight: "340px",
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                cursor: "pointer",
                background: "transparent",
                transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(18, 64, 60, 0.03)";
                e.currentTarget.style.borderColor = "var(--primary)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
            }}
        >
            <div style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
                marginBottom: "8px"
            }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>

            <div style={{ textAlign: "center" }}>
                <span style={{
                    display: "block",
                    fontWeight: "600",
                    color: "var(--text)",
                    marginBottom: "4px",
                    fontFamily: "var(--font-heading)",
                    fontSize: "16px"
                }}>
                    Add Watch
                </span>
                <span style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-body)"
                }}>
                    Select to compare
                </span>
            </div>
        </div>
    );
}
