import React from "react";

interface CompareIconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    strokeWidth?: number;
}

export function CompareIcon({ className, strokeWidth = 2, ...props }: CompareIconProps) {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            <path d="M8 3 4 7 8 11" />
            <path d="M4 7 h16" />
            <path d="m16 21 4-4-4-4" />
            <path d="M20 17 H4" />
        </svg>
    );
}
