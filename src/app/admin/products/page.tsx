import Link from 'next/link';
import prisma from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import DeleteProductButton from '@/components/admin/DeleteProductButton';
import EmptyState from '@/components/admin/EmptyState';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
};

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface ProductWithStock {
    id: string;
    name: string;
    imageUrl: string | null;
    status: string;
    variants: {
        id: string;
        sku: string;
        price: Decimal;
        inventory: { available: number }[];
    }[];
    totalStock: number;
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
    const stockFilter = (resolvedParams.stock as StockFilter) || 'all';
    const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : '';
    const pageSize = 10;

    // Fetch all products
    const allProducts = await prisma.product.findMany({
        where: search ? { name: { contains: search } } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            variants: {
                include: {
                    inventory: true
                }
            }
        }
    });

    // Calculate stock and map to correct type
    const productsWithStock: ProductWithStock[] = allProducts.map(product => ({
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        status: (product as { status?: string }).status || 'active',
        variants: product.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            price: v.price,
            inventory: v.inventory
        })),
        totalStock: product.variants.reduce((acc, v) => 
            acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0
        )
    }));

    // Apply stock filter
    let filteredProducts = productsWithStock;
    if (stockFilter === 'in_stock') {
        filteredProducts = productsWithStock.filter(p => p.totalStock >= 10);
    } else if (stockFilter === 'low_stock') {
        filteredProducts = productsWithStock.filter(p => p.totalStock > 0 && p.totalStock < 10);
    } else if (stockFilter === 'out_of_stock') {
        filteredProducts = productsWithStock.filter(p => p.totalStock === 0);
    }

    // Pagination
    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / pageSize);
    const paginatedProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize);

    // Stock filter tabs
    const stockFilters = [
        { value: 'all', label: 'All Products', count: productsWithStock.length },
        { value: 'in_stock', label: 'In Stock', count: productsWithStock.filter(p => p.totalStock >= 10).length },
        { value: 'low_stock', label: 'Low Stock', count: productsWithStock.filter(p => p.totalStock > 0 && p.totalStock < 10).length },
        { value: 'out_of_stock', label: 'Out of Stock', count: productsWithStock.filter(p => p.totalStock === 0).length },
    ];

    const buildUrl = (params: Record<string, string | number | undefined>) => {
        const urlParams = new URLSearchParams();
        if (params.stock && params.stock !== 'all') urlParams.set('stock', String(params.stock));
        if (params.search) urlParams.set('search', String(params.search));
        if (typeof params.page === 'number' && params.page > 1) urlParams.set('page', String(params.page));
        const query = urlParams.toString();
        return `/admin/products${query ? `?${query}` : ''}`;
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Products Inventory</h1>
                    <p className="admin-subtitle">Manage catalog, pricing, and stock availability</p>
                </div>
                <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
                    + Add Product
                </Link>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                {/* Stock Tabs */}
                <div className="admin-tabs-container">
                    {stockFilters.map((filter) => {
                        const isActive = stockFilter === filter.value;
                        return (
                            <Link
                                key={filter.value}
                                href={buildUrl({ stock: filter.value, search })}
                                className={`admin-tab-pill ${isActive ? 'active' : ''}`}
                            >
                                {filter.label}
                                <span style={{ 
                                    marginLeft: '6px', 
                                    opacity: 0.7,
                                    fontSize: '11px'
                                }}>
                                    ({filter.count})
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Search */}
                <form className="admin-search-wrapper">
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search products..."
                        defaultValue={search}
                        className="admin-search-input"
                        autoComplete="off"
                    />
                    {stockFilter !== 'all' && (
                        <input type="hidden" name="stock" value={stockFilter} />
                    )}
                </form>
            </div>

            {/* Products Table */}
            {paginatedProducts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Image</th>
                                <th>Product Details</th>
                                <th>SKU & Variants</th>
                                <th>Price Range</th>
                                <th>Stock Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product) => {
                                const mainVariant = product.variants[0];
                                const img = product.imageUrl;
                                
                                return (
                                    <tr key={product.id}>
                                        <td>
                                            <div style={{
                                                width: '56px',
                                                height: '56px',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                background: '#fff',
                                                border: '1px solid var(--admin-border)'
                                            }}>
                                                {img ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img 
                                                        src={img} 
                                                        alt={product.name} 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999', background: '#f8f8f8' }}>
                                                        NO IMG
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)', fontSize: '15px' }}>{product.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {product.variants.length} Variants
                                                {product.status !== 'active' && (
                                                    <span className={`status-badge ${product.status === 'draft' ? 'status-pending' : 'status-cancelled'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                                        {product.status}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {product.variants.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {product.variants.slice(0, 2).map(v => (
                                                        <span key={v.id} style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.03)', padding: '2px 4px', borderRadius: '3px', width: 'fit-content' }}>
                                                            {v.sku}
                                                        </span>
                                                    ))}
                                                    {product.variants.length > 2 && (
                                                        <span style={{ fontSize: '10px', color: '#999', paddingLeft: '4px' }}>+{product.variants.length - 2} more</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#999' }}>-</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                                            {mainVariant?.price ? formatCurrency(Number(mainVariant.price)) : '-'}
                                            {product.variants.length > 1 && (
                                                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--admin-text-muted)', marginLeft: '4px' }}>
                                                    (starts from)
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${product.totalStock > 0 ? (product.totalStock < 10 ? 'status-pending' : 'status-paid') : 'status-cancelled'}`}>
                                                {product.totalStock > 0 ? `${product.totalStock} in stock` : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                                <Link 
                                                    href={`/admin/products/${product.id}`}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '8px 16px', fontSize: '11px' }}
                                                >
                                                    Edit
                                                </Link>
                                                
                                                <DeleteProductButton productId={product.id} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    icon="📦"
                    title={search ? 'No products found' : 'No products yet'}
                    description={search ? 'Try adjusting your search or filters' : 'Add your first product to start selling.'}
                    actionLabel={!search ? 'Create Product' : undefined}
                    actionHref={!search ? '/admin/products/new' : undefined}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <Link
                        href={buildUrl({ stock: stockFilter, search, page: page - 1 })}
                        className={`admin-btn admin-btn-outline ${page <= 1 ? 'disabled' : ''}`}
                        style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.5 : 1 }}
                    >
                        Previous
                    </Link>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        Page {page} of {totalPages}
                    </span>
                    <Link
                        href={buildUrl({ stock: stockFilter, search, page: page + 1 })}
                        className={`admin-btn admin-btn-outline ${page >= totalPages ? 'disabled' : ''}`}
                        style={{ pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </Link>
                </div>
            )}
        </div>
    );
}
