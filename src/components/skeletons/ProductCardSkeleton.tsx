import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <div className="product-media relative" style={{aspectRatio: '3/4', width: '100%', overflow: 'hidden', backgroundColor: 'var(--surface-dark)'}}>
        <Skeleton style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="product-body" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Skeleton style={{ height: '24px', width: '75%' }} />
        <Skeleton style={{ height: '20px', width: '25%' }} />
        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <Skeleton style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
            <Skeleton style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
            <Skeleton style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
        </div>
      </div>
    </div>
  );
}
