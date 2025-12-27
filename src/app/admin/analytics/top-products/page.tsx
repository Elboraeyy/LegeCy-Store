import Link from 'next/link';
import Image from 'next/image';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import '@/app/admin/admin.css';

export const dynamic = 'force-dynamic';

export default async function TopProductsPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    // Get all-time top products with more details
    const topProducts = await prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        _sum: { quantity: true, price: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 50
    });

    // Get product details (only fetch fields that exist in schema)
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { 
            id: true, 
            name: true, 
            category: true,
            imageUrl: true
        }
    });
    
    // Get category names
    const categoryIds = products.map(p => p.category).filter(Boolean) as string[];
    const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true }
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    const productMap = new Map(products.map(p => [p.id, {
        ...p,
        categoryName: p.category ? categoryMap.get(p.category) : null
    }]));

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/admin/analytics" className="back-btn" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        textDecoration: 'none',
                        color: '#333'
                    }}>
                        ←
                    </Link>
                    <div>
                        <h1 className="admin-title">Top Selling Products</h1>
                        <p className="admin-subtitle">All-time best performing products by sales volume</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="analytics-kpi-grid" style={{ marginBottom: '24px' }}>
                <div className="admin-card mini-kpi-card" style={{ background: '#dcfce7', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>📦</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', fontWeight: 600 }}>Total Products Sold</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#166534' }}>
                                {topProducts.reduce((sum, p) => sum + (p._sum?.quantity || 0), 0).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#fef3c7', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>💰</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#92400e', textTransform: 'uppercase', fontWeight: 600 }}>Total Revenue</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#92400e' }}>
                                {formatCurrency(topProducts.reduce((sum, p) => sum + Number(p._sum?.price || 0), 0))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#dbeafe', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>🛒</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#1e40af', textTransform: 'uppercase', fontWeight: 600 }}>Unique Products</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e40af' }}>
                                {topProducts.length}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="admin-card mini-kpi-card" style={{ background: '#f3e8ff', border: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '24px' }}>📊</span>
                        <div>
                            <div style={{ fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', fontWeight: 600 }}>Avg. Price</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>
                                {formatCurrency(topProducts.length > 0 && topProducts.reduce((sum, p) => sum + (p._sum?.quantity || 0), 0) > 0 
                                    ? topProducts.reduce((sum, p) => sum + Number(p._sum?.price || 0), 0) / topProducts.reduce((sum, p) => sum + (p._sum?.quantity || 0), 0) 
                                    : 0)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="admin-card">
                <div className="admin-table-container" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '50px' }}>#</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Units Sold</th>
                                <th>Total Revenue</th>
                                <th>Orders</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.map((product, i) => {
                                const details = productMap.get(product.productId);
                                return (
                                    <tr key={product.productId}>
                                        <td>
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                background: i < 3 ? 'var(--admin-accent)' : '#eee',
                                                color: i < 3 ? '#1a3c34' : '#555',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 700
                                            }}>
                                                {i + 1}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    background: '#f5f5f5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    {details?.imageUrl ? (
                                                        <Image 
                                                            src={details.imageUrl} 
                                                            alt={product.name}
                                                            width={40}
                                                            height={40}
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '20px' }}>📦</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{product.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 10px',
                                                background: '#f5f5f5',
                                                borderRadius: '99px',
                                                fontSize: '12px'
                                            }}>
                                                {details?.categoryName || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 700, fontSize: '16px' }}>
                                            {(product._sum?.quantity || 0).toLocaleString()}
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--admin-accent)' }}>
                                            {formatCurrency(Number(product._sum?.price || 0))}
                                        </td>
                                        <td>{product._count?.id || 0}</td>
                                        <td>
                                            <Link 
                                                href={`/admin/products/${product.productId}`}
                                                className="admin-btn admin-btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                            {topProducts.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                                        No sales data yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-EG', { 
        style: 'currency', 
        currency: 'EGP', 
        maximumFractionDigits: 0 
    }).format(value);
}
