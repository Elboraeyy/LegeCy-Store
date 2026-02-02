import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-[#FCF8F3] grid grid-cols-1 lg:grid-cols-3">
      {/* Brand Side Skeleton (Desktop) */}
      <div className="hidden lg:flex lg:col-span-1 bg-[#12403C] p-12 flex-col justify-center relative overflow-hidden">
         <div className="space-y-8 relative z-10">
            <Skeleton className="h-4 w-32 bg-white/10" />
            <Skeleton className="h-32 w-full bg-white/10" />
            <Skeleton className="h-24 w-full bg-white/10" />
            <div className="pt-8 border-t border-white/10 flex gap-4">
               <Skeleton className="h-4 w-24 bg-white/10" />
               <Skeleton className="h-4 w-4 bg-white/10 rounded-full" />
               <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
         </div>
      </div>

      {/* Form Side Skeleton */}
      <div className="lg:col-span-2 flex items-center justify-center p-8 bg-[#FCF8F3]">
         <div className="w-full max-w-md space-y-8">
            <div className="text-center space-y-4">
               <Skeleton className="h-10 w-48 mx-auto" />
               <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between">
                     <Skeleton className="h-4 w-20" />
                     <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-lg" />
               </div>
               
               <Skeleton className="h-12 w-full rounded-full mt-6" />
            </div>

            <div className="flex items-center gap-4 py-6">
               <Skeleton className="h-[1px] w-full" />
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-[1px] w-full" />
            </div>

            <div className="flex justify-center gap-4">
               <Skeleton className="h-12 w-12 rounded-full" />
               <Skeleton className="h-12 w-12 rounded-full" />
            </div>

            <Skeleton className="h-4 w-64 mx-auto mt-8" />
         </div>
      </div>
    </div>
  );
}
