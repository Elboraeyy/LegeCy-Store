import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export function ShopSkeleton() {
   return (
      <div className="min-h-screen bg-[#FCF8F3]">
         {/* Mobile Skeleton */}
         <div className="md:hidden">
            {/* Mobile Header / Search Placeholder */}
            <div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
               <div className="flex gap-2">
                  <Skeleton className="h-10 w-full rounded-lg" style={{ backgroundColor: '#E0EFEA' }} />
                  <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" style={{ backgroundColor: '#E0EFEA' }} />
               </div>
               {/* Filter Tabs */}
               <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {[1, 2, 3, 4].map(i => (
                     <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" style={{ backgroundColor: '#E0EFEA' }} />
                  ))}
               </div>
            </div>

            {/* Mobile Product Grid */}
            <div className="p-3 flex overflow-x-auto gap-3 pb-4 hide-scrollbar snap-x">
               {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[150px] w-[45%] flex-none snap-start">
                     <ProductCardSkeleton />
                  </div>
               ))}
            </div>
         </div>

         {/* Desktop Skeleton */}
         <div className="hidden md:block">
            {/* Mobile Hero Skeleton (Desktop view uses this too currently but let's keep logic) */}
            <div className="bg-[#12403C] text-center py-12 mb-8 relative overflow-hidden">
               <div className="container mx-auto px-4 relative z-10 flex flex-col items-center gap-4">
                  <Skeleton className="h-10 w-48 bg-white/10" />
                  <Skeleton className="h-4 w-64 bg-white/10" />
               </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 pb-16">
               <div className="flex gap-8">
                  {/* Sidebar Skeleton - Desktop */}
                  <div className="hidden lg:block w-64 flex-shrink-0 space-y-8">
                     <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-2">
                           {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-4 rounded" />
                                    <Skeleton className="h-4 w-24" />
                                 </div>
                                 <Skeleton className="h-4 w-8" />
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-2 w-full" />
                        <div className="flex justify-between">
                           <Skeleton className="h-8 w-16" />
                           <Skeleton className="h-8 w-16" />
                        </div>
                     </div>
                  </div>

                  {/* Main Content Skeleton */}
                  <div className="flex-1">
                     {/* Toolbar Skeleton */}
                     <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-8 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-8 w-24 lg:hidden" /> {/* Filter btn mobile */}
                           <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="hidden sm:flex gap-1">
                              <Skeleton className="h-8 w-8 rounded" />
                              <Skeleton className="h-8 w-8 rounded" />
                           </div>
                           <Skeleton className="h-10 w-40 rounded-lg" />
                        </div>
                     </div>

                     {/* Product Grid Skeleton */}
                     <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                           <ProductCardSkeleton key={i} />
                        ))}
                     </div>

                     {/* Pagination Skeleton */}
                     <div className="mt-8 flex justify-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
