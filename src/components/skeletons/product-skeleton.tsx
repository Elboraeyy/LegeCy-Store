import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";

export function ProductSkeleton() {
   return (
      <div className="container mx-auto px-4 py-8">
         {/* Mobile Skeleton */}
         <div className="md:hidden space-y-6">
            {/* Mobile Gallery (Square) */}
            <div className="w-full aspect-square rounded-2xl overflow-hidden relative">
               <Skeleton className="w-full h-full" style={{ backgroundColor: '#E0EFEA' }} />
            </div>

            {/* Mobile Info */}
            <div className="space-y-4">
               <div className="flex justify-between items-start">
                  <div className="space-y-2 w-2/3">
                     <Skeleton className="h-4 w-24" style={{ backgroundColor: '#E0EFEA' }} />
                     <Skeleton className="h-8 w-full" style={{ backgroundColor: '#E0EFEA' }} />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" style={{ backgroundColor: '#E0EFEA' }} /> {/* Price pill */}
               </div>

               {/* Action Bar Placeholder */}
               <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-100 flex gap-3 z-50">
                  <Skeleton className="h-12 w-full rounded-full" style={{ backgroundColor: '#E0EFEA' }} />
               </div>

               <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-full" style={{ backgroundColor: '#E0EFEA' }} />
                  <Skeleton className="h-4 w-full" style={{ backgroundColor: '#E0EFEA' }} />
                  <Skeleton className="h-4 w-3/4" style={{ backgroundColor: '#E0EFEA' }} />
               </div>
            </div>
         </div>

         {/* Desktop Skeleton */}
         <div className="hidden md:block">
            {/* Breadcrumb Skeleton */}
            <div className="flex items-center gap-2 mb-8">
               <Skeleton className="h-4 w-16" />
               <Skeleton className="h-4 w-4" />
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-4 w-4" />
               <Skeleton className="h-4 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
               {/* Gallery Skeleton */}
               <div className="space-y-4">
                  {/* Main Image */}
                  <div className="w-full aspect-[4/5] md:aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                     <Skeleton className="h-full w-full" />
                  </div>
                  {/* Thumbnails */}
                  <div className="flex gap-4 overflow-x-auto pb-2">
                     {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-md" />
                     ))}
                  </div>
               </div>

               {/* Product Info Skeleton */}
               <div className="space-y-6">
                  <Skeleton className="h-4 w-24" /> {/* Brand/Category */}
                  <Skeleton className="h-10 w-3/4" /> {/* Title */}

                  <div className="flex items-center gap-2">
                     <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                           <Skeleton key={i} className="h-4 w-4 rounded-full" />
                        ))}
                     </div>
                     <Skeleton className="h-4 w-32" />
                  </div>

                  <div className="space-y-2">
                     <Skeleton className="h-8 w-40" /> {/* Price */}
                     <Skeleton className="h-4 w-full" /> {/* Desc */}
                     <Skeleton className="h-4 w-full" />
                     <Skeleton className="h-4 w-2/3" />
                  </div>

                  <div className="flex gap-4 pt-4">
                     <Skeleton className="h-12 w-32 rounded-lg" /> {/* Qty */}
                     <Skeleton className="h-12 w-full rounded-full" /> {/* Add to Cart */}
                  </div>

                  <div className="flex gap-4">
                     <Skeleton className="h-8 w-8 rounded-full" />
                     <Skeleton className="h-8 w-8 rounded-full" />
                     <Skeleton className="h-8 w-8 rounded-full" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                  </div>

                  <div className="pt-6 space-y-4">
                     <Skeleton className="h-12 w-full rounded-lg" />
                     <Skeleton className="h-12 w-full rounded-lg" />
                     <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
               </div>
            </div>

            {/* Related Products Skeleton */}
            <div className="space-y-8">
               <Skeleton className="h-8 w-48 mx-auto" />
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                     <ProductCardSkeleton key={i} />
                  ))}
               </div>
            </div>
         </div>
      </div>
   );
}
