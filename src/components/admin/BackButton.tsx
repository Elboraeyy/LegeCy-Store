"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
    fallbackHref?: string;
    label?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Smart back button that navigates to the previous page.
 * Uses browser history if available, otherwise falls back to provided href.
 */
export default function BackButton({ 
    fallbackHref = "/admin", 
    label = "← Back",
    className = "",
    style
}: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        // Check if there's history to go back to
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackHref);
        }
    };

    return (
        <button 
            onClick={handleClick}
            className={className || "admin-btn admin-btn-outline"}
            style={{ 
                cursor: 'pointer',
                textDecoration: 'none',
                ...style 
            }}
        >
            {label}
        </button>
    );
}
