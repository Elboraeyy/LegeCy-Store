import '@/app/admin/admin.css';

interface CardSkeletonProps {
    count?: number;
}

export default function CardSkeleton({ count = 4 }: CardSkeletonProps) {
    return (
        <div className="admin-grid">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="admin-card">
                    <div 
                        className="skeleton skeleton-text" 
                        style={{ width: '40%', height: '12px', marginBottom: '16px' }} 
                    />
                    <div 
                        className="skeleton skeleton-text" 
                        style={{ width: '60%', height: '32px', marginBottom: '12px' }} 
                    />
                    <div 
                        className="skeleton skeleton-text" 
                        style={{ width: '80%', height: '12px' }} 
                    />
                </div>
            ))}
        </div>
    );
}
