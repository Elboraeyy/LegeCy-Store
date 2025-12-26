import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main>
      {/* Hero Skeleton */}
      <section className="container" style={{ padding: '120px 0 100px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px', margin: '0 auto', alignItems: 'center' }}>
          <Skeleton style={{ height: '64px', width: '75%' }} />
          <Skeleton style={{ height: '96px', width: '100%' }} />
          <Skeleton style={{ height: '48px', width: '200px', marginTop: '16px', borderRadius: '999px' }} />
        </div>
      </section>

      {/* Featured Collection Skeleton */}
      <section className="container collection-section">
         <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '32px', height: '600px' }}>
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
            <Skeleton style={{ width: '100%', height: '100%', borderRadius: '4px' }} />
         </div>
      </section>

      {/* Legacy Section Skeleton */}
      <section className="container legacy-section">
        <div className="legacy-wrapper">
             <div className="legacy-image-wrapper">
                <Skeleton style={{ width: '100%', height: '100%' }} />
             </div>
            <div className="legacy-text-content" style={{gap: '24px'}}>
                <Skeleton style={{ height: '20px', width: '120px' }} />
                <Skeleton style={{ height: '60px', width: '80%' }} />
                <Skeleton style={{ height: '100px', width: '100%' }} />
                <Skeleton style={{ height: '40px', width: '200px' }} />
            </div>
        </div>
      </section>
    </main>
  );
}
