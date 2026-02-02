import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-[#FCF8F3] pb-20">
      {/* Hero Skeleton */}
      <div className="bg-[#12403C] py-12 mb-8 flex flex-col items-center justify-center gap-4 text-center">
         <Skeleton className="h-10 w-48 bg-white/10" />
         <Skeleton className="h-4 w-64 bg-white/10" />
      </div>

      <div className="container mx-auto px-4 max-w-4xl space-y-8">
         {/* Profile Card Skeleton */}
         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
               <Skeleton className="h-24 w-24 rounded-full border-4 border-white shadow-lg" />
               <div className="flex-1 text-center md:text-left space-y-2">
                  <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-40 mx-auto md:mx-0" />
               </div>
               <Skeleton className="h-10 w-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
               {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center space-y-2">
                     <Skeleton className="h-6 w-12 mx-auto" />
                     <Skeleton className="h-3 w-16 mx-auto" />
                  </div>
               ))}
            </div>
         </div>

         {/* Loyalty Card Skeleton */}
         <div className="bg-gradient-to-r from-[#d4af37] to-[#bba060] rounded-2xl p-6 flex justify-between items-center text-white">
            <div className="space-y-2">
               <Skeleton className="h-6 w-32 bg-white/20" />
               <Skeleton className="h-8 w-24 bg-white/20" />
            </div>
            <div className="text-right space-y-1">
               <Skeleton className="h-4 w-40 bg-white/20" />
               <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
         </div>

         {/* Recent Orders Skeleton */}
         <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100">
               <Skeleton className="h-6 w-32" />
               <Skeleton className="h-4 w-20" />
            </div>
            {[1, 2, 3].map((i) => (
               <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
                     <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                     </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16" />
               </div>
            ))}
         </div>

         {/* Quick Links Skeleton */}
         <div className="space-y-4">
             <Skeleton className="h-6 w-32" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[1, 2, 3, 4].map((i) => (
                     <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                         <Skeleton className="h-10 w-10 rounded-full" />
                         <div className="flex-1 space-y-1">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-48" />
                         </div>
                         <Skeleton className="h-4 w-4" />
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
}
