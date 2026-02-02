import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="product-card bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="product-media relative skeleton" style={{ aspectRatio: '3/4', width: '100%', overflow: 'hidden' }}>
      </div>
      <div className="product-body p-2 sm:p-3 md:p-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton style={{ height: '16px', width: '75%' }} />
        <Skeleton style={{ height: '14px', width: '40%' }} />
        {/* Action buttons - desktop only */}
        <div className="hidden md:flex gap-2 pt-2">
          <Skeleton style={{ height: '32px', width: '32px', borderRadius: '50%' }} />
          <Skeleton style={{ height: '32px', width: '32px', borderRadius: '50%' }} />
          <Skeleton style={{ height: '32px', width: '32px', borderRadius: '50%' }} />
        </div>
      </div>
    </div>
  );
}
