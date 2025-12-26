import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export function ProductDetailsSkeleton() {
  return (
    <main className="container" style={{ padding: '80px 24px' }}>

      {/* Breadcrumb Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <Skeleton style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
        <Skeleton style={{ width: '150px', height: '20px' }} />
      </div>

      <div className="detail-split">
        {/* Gallery Skeletons */}
        <div className="detail-gallery">
            <div style={{ width: '100%', aspectRatio: '1/1', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                <Skeleton style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <Skeleton style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
                <Skeleton style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
                <Skeleton style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
            </div>
        </div>

        {/* Content Skeletons */}
        <div className="detail-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div>
               <Skeleton style={{ height: '48px', width: '80%', marginBottom: '16px' }} />
               <Skeleton style={{ height: '24px', width: '40%' }} />
           </div>
           
           <Skeleton style={{ height: '36px', width: '30%' }} />
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <Skeleton style={{ height: '16px', width: '100%' }} />
               <Skeleton style={{ height: '16px', width: '100%' }} />
               <Skeleton style={{ height: '16px', width: '90%' }} />
           </div>

           <div className="actions-large" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
               <Skeleton style={{ height: '56px', width: '100%', borderRadius: '999px' }} />
               <Skeleton style={{ height: '56px', width: '100%', borderRadius: '999px' }} />
           </div>

           <div style={{ marginTop: '40px' }}>
               <Skeleton style={{ height: '32px', width: '50%', marginBottom: '24px' }} />
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <Skeleton style={{ height: '24px', width: '100%' }} />
                   <Skeleton style={{ height: '24px', width: '100%' }} />
                   <Skeleton style={{ height: '24px', width: '100%' }} />
                   <Skeleton style={{ height: '24px', width: '100%' }} />
               </div>
           </div>
        </div>
      </div>
    </main>
  );
}
