import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function InfoSkeleton() {
  return (
    <div className="min-h-screen bg-[#FCF8F3] pb-20">
      {/* Hero Skeleton */}
      <div className="bg-[#12403C] py-16 mb-12 flex flex-col items-center justify-center gap-4 text-center">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <Skeleton className="h-4 w-48 bg-white/10" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl space-y-8">
         <div className="bg-white p-8 rounded-2xl border border-gray-100 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-3">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-3/4" />
            </div>
            
            <Skeleton className="h-8 w-40 pt-4" />
            <div className="space-y-3">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-1/2" />
            </div>

             <Skeleton className="h-8 w-56 pt-4" />
            <div className="space-y-3">
               <Skeleton className="h-4 w-full" />
               <Skeleton className="h-4 w-full" />
            </div>
         </div>
      </div>
    </div>
  );
}
