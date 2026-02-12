import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export function WishlistSkeleton() {
    return (
        <div className="min-h-screen bg-[#FCF8F3] pb-20">
            {/* Hero Skeleton */}
            <div className="bg-[#12403C] py-16 mb-12 flex flex-col items-center justify-center gap-4 text-center">
                <Skeleton className="h-10 w-28 rounded-full bg-white/10" />
                <Skeleton className="h-4 w-64 bg-white/10" />
                <Skeleton className="h-10 w-32 rounded-full bg-white/10 mt-2" />
            </div>

            {/* Mobile - Horizontal Scroll */}
            <div className="md:hidden px-3 flex overflow-x-auto gap-3 pb-4 hide-scrollbar snap-x">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="min-w-[150px] w-[45%] flex-none snap-start">
                        <ProductCardSkeleton />
                    </div>
                ))}
            </div>
            {/* Desktop - Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
