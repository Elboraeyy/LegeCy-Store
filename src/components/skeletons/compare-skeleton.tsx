import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function CompareSkeleton() {
    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Hero Skeleton */}
            <div className="bg-[#12403C] py-8 md:py-12 mb-8 flex flex-col items-center justify-center gap-4 text-center">
                <Skeleton className="h-10 w-48 bg-white/10" />
                <Skeleton className="h-4 w-64 bg-white/10" />
            </div>

            <section className="container mx-auto px-4 md:px-8">
                {/* Thumbnails Row */}
                <div className="flex gap-4 overflow-x-auto justify-center mb-8 pb-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-[100px] w-[100px] rounded-2xl flex-shrink-0" />
                    ))}
                    <Skeleton className="h-[100px] w-[100px] rounded-2xl border-2 border-dashed border-gray-100 bg-transparent flex-shrink-0" />
                </div>

                {/* Main Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1000px] mx-auto mb-10">
                    <div className="hidden md:block" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-4">
                            <Skeleton className="w-full aspect-[3/4] rounded-xl" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-20 mx-auto" />
                            <Skeleton className="h-10 w-full rounded-full" />
                        </div>
                    ))}
                </div>

                {/* Spec Accordions */}
                <div className="max-w-[1000px] mx-auto space-y-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="p-6 flex justify-between items-center">
                                <Skeleton className="h-8 w-40" />
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                            <div className="p-6 space-y-4 pt-0">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="grid grid-cols-4 gap-6 py-4 border-t border-gray-50">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-12 mx-auto" />
                                        <Skeleton className="h-4 w-12 mx-auto" />
                                        <Skeleton className="h-4 w-12 mx-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
