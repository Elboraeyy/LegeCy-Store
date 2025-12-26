import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="container" style={{ padding: "40px 24px" }}>
        {/* Shop Hero Skeleton */}
        <div style={{ marginBottom: '60px', textAlign: 'center' }}>
            <Skeleton style={{ width: '300px', height: '56px', margin: '0 auto 16px' }} />
            <Skeleton style={{ width: '400px', height: '24px', margin: '0 auto' }} />
        </div>

      <div className="shop-layout">
        {/* Sidebar Skeleton */}
        <div className="shop-sidebar">
            <Skeleton style={{ height: '32px', width: '150px', marginBottom: '24px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Skeleton style={{ height: '20px', width: '100%' }} />
                <Skeleton style={{ height: '20px', width: '100%' }} />
                <Skeleton style={{ height: '20px', width: '100%' }} />
                <Skeleton style={{ height: '20px', width: '100%' }} />
            </div>
            <Skeleton style={{ height: '32px', width: '150px', margin: '32px 0 24px' }} /> 
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Skeleton style={{ height: '20px', width: '100%' }} />
                <Skeleton style={{ height: '20px', width: '80%' }} />
            </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="product-grid-large" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
