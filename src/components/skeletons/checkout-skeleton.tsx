import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Skeleton */}
      <div className="bg-[#12403C] py-12 mb-8 flex flex-col items-center justify-center gap-4">
        <Skeleton className="h-10 w-48 bg-white/10" />
        <Skeleton className="h-4 w-64 bg-white/10" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column - Forms */}
           <div className="lg:col-span-2 space-y-6">
              {/* Contact Info */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
                 <div className="flex gap-4 items-center mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                       <Skeleton className="h-6 w-32" />
                       <Skeleton className="h-4 w-48" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <div className="grid grid-cols-2 gap-4">
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-12 w-full" />
                 </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
                 <div className="flex gap-4 items-center mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                       <Skeleton className="h-6 w-32" />
                       <Skeleton className="h-4 w-48" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <Skeleton className="h-12 w-full" />
                       <Skeleton className="h-12 w-full" />
                    </div>
                    <Skeleton className="h-24 w-full" />
                 </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6">
                 <div className="flex gap-4 items-center mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                       <Skeleton className="h-6 w-32" />
                       <Skeleton className="h-4 w-48" />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                 </div>
              </div>
           </div>

           {/* Right Column - Summary */}
           <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-6 sticky top-24">
                 <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-12" />
                 </div>

                 {/* Items */}
                 <div className="space-y-4 max-h-60 overflow-hidden">
                    {[1, 2].map(i => (
                       <div key={i} className="flex gap-3">
                          <Skeleton className="h-16 w-16 rounded-md" />
                          <div className="flex-1 space-y-2">
                             <Skeleton className="h-4 w-24" />
                             <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                       </div>
                    ))}
                 </div>

                 <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between">
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                       <Skeleton className="h-4 w-20" />
                       <Skeleton className="h-4 w-16" />
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-24" />
                 </div>

                 <Skeleton className="h-12 w-full rounded-full" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
