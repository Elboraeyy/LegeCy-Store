import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export function HomeSkeleton() {
  return (
    <div className="w-full">
      {/* Mobile Skeleton */}
      <div className="md:hidden space-y-8 pb-12">
        {/* Mobile Hero */}
        <section className="h-[60vh] flex flex-col items-center justify-center container px-4 text-center gap-4 bg-[#fcf8f3]" style={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-16 w-full mx-auto" />
          <Skeleton className="h-10 w-40 rounded-full mx-auto mt-2" />
        </section>

        {/* Mobile Featured Grid (2 cols) */}
        <section className="px-0">
          <div className="flex justify-between items-end mb-4 px-4">
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar snap-x px-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[calc(50%-4px)] flex-none snap-start">
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </section>

        {/* Mobile Collection Stack */}
        <section className="container px-4 space-y-4">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </section>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block">
        {/* Hero Skeleton */}
        <section className="min-h-[80vh] flex flex-col items-center justify-center container mx-auto px-4 py-20 text-center gap-6">
          <Skeleton className="h-16 w-3/4 max-w-2xl mx-auto" />
          <Skeleton className="h-24 w-full max-w-xl mx-auto" />
          <Skeleton className="h-12 w-48 rounded-full mx-auto mt-4" />
        </section>

        {/* Promotions Hub Skeleton */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </section>

        {/* Featured Products Carousel Skeleton */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Collection Section Skeleton */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton className="h-[500px] w-full rounded-lg" />
            <Skeleton className="h-[500px] w-full rounded-lg" />
          </div>
        </section>

        {/* New Arrivals Skeleton */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-end mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </section>

        {/* Trust Badge Skeleton */}
        <section className="py-24 bg-[#12403C]/10 mt-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex flex-col items-center gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Legacy Section Skeleton */}
        <section className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Skeleton className="h-[600px] w-full rounded-lg" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-48 rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
