import '@/app/admin/admin.css';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
    return (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex}>
                                    <div 
                                        className="skeleton skeleton-text" 
                                        style={{ 
                                            width: colIndex === 0 ? '60%' : '80%',
                                            animationDelay: `${rowIndex * 0.1}s`
                                        }} 
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
