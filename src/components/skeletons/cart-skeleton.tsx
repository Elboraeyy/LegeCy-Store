import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-[#FCF8F3] pb-20">
      {/* Hero Skeleton */}
      <div className="bg-[#12403C] py-12 mb-12 flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="h-4 w-32 bg-white/10" />
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
           {/* Left Column */}
           <div className="flex-1 space-y-8">
              {/* Shipping Progress Skeleton */}
              <div className="bg-white p-6 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                 </div>
                 <Skeleton className="h-2 w-full rounded-full" />
              </div>

              {/* Cart Items Skeleton */}
              <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4">
                       <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
                       <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                             <div className="space-y-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-4 w-16" />
                             </div>
                             <Skeleton className="h-4 w-4" />
                          </div>
                          <div className="flex justify-between items-end mt-4">
                             <Skeleton className="h-8 w-24 rounded-full" />
                             <Skeleton className="h-6 w-20" />
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Right Column - Summary */}
           <div className="lg:w-[380px] flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                 <Skeleton className="h-6 w-32" />
                 <div className="space-y-3">
                    <div className="flex justify-between">
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                       <Skeleton className="h-4 w-24" />
                       <Skeleton className="h-4 w-16" />
                    </div>
                 </div>
                 <div className="pt-4 border-t border-gray-100 flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-24" />
                 </div>
                 <Skeleton className="h-12 w-full rounded-full" />
                 <div className="flex justify-center gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
