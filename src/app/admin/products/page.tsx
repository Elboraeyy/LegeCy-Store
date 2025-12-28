'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { 
    fetchProductStats, 
    bulkDeleteProducts, 
    bulkUpdateStatus, 
    duplicateProduct,
    ProductStats 
} from '@/lib/actions/product';
import { deleteProductAction } from '@/lib/actions/product';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { toast } from 'sonner';

interface ProductWithStock {
    id: string;
    name: string;
    imageUrl: string | null;
    status: string;
    categoryId: string | null;
    categoryName: string | null;
    variants: {
        id: string;
        sku: string;
        price: number;
    }[];
    totalStock: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function ProductsPage() {
    const router = useRouter();
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [stats, setStats] = useState<ProductStats | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [search, setSearch] = useState('');
    const [stockFilter, setStockFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showBulkMenu, setShowBulkMenu] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [statsData, productsRes] = await Promise.all([
                fetchProductStats(),
                fetch('/api/admin/products').then(r => r.json())
            ]);
            setStats(statsData);
            
            // Transform products - ensure it's an array
            const productsArray = Array.isArray(productsRes) ? productsRes : [];
            const transformed: ProductWithStock[] = productsArray.map((p: { 
                id: string; 
                name: string; 
                imageUrl: string | null; 
                status: string;
                categoryId: string | null;
                category?: { name: string } | null;
                variants: { id: string; sku: string; price: number; inventory: { available: number }[] }[];
            }) => ({
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                status: p.status || 'active',
                categoryId: p.categoryId,
                categoryName: p.category?.name || null,
                variants: p.variants.map(v => ({ id: v.id, sku: v.sku, price: Number(v.price) })),
                totalStock: p.variants.reduce((acc, v) => 
                    acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0)
            }));
            
            setProducts(transformed);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error('Failed to load products');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('PRODUCTS_VIEW')) {
            const timer = setTimeout(() => {
                void loadData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadData]);

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) || 
                              product.variants.some(v => v.sku.toLowerCase().includes(search.toLowerCase()));
        
        let matchesStock = true;
        if (stockFilter === 'in_stock') matchesStock = product.totalStock > 0;
        else if (stockFilter === 'low_stock') matchesStock = product.totalStock > 0 && product.totalStock < 10;
        else if (stockFilter === 'out_of_stock') matchesStock = product.totalStock === 0;

        const matchesCategory = !categoryFilter || product.categoryId === categoryFilter;
        const matchesStatus = !statusFilter || product.status === statusFilter;
        
        return matchesSearch && matchesStock && matchesCategory && matchesStatus;
    });

    const toggleSelect = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length && filteredProducts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };

    // Actions
    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        const res = await deleteProductAction(id);
        if (res.success) {
            toast.success('Product deleted');
            setLoading(true);
            loadData();
        } else {
            toast.error(res.error || 'Failed to delete');
        }
    };

    const handleDuplicate = async (id: string) => {
        const res = await duplicateProduct(id);
        if (res.success) {
            toast.success('Product duplicated');
            router.push(`/admin/products/${res.newId}`);
        } else {
            toast.error(res.error || 'Failed to duplicate');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} products?`)) return;
        const res = await bulkDeleteProducts(selectedIds);
        toast.success(`Deleted ${res.deleted} products`);
        setSelectedIds([]);
        setLoading(true);
        loadData();
    };

    const handleBulkStatus = async (status: string) => {
        const res = await bulkUpdateStatus(selectedIds, status);
        toast.success(`Updated ${res.updated} products to ${status}`);
        setSelectedIds([]);
        setShowBulkMenu(false);
        setLoading(true);
        loadData();
    };

    if (permLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>Loading...</div>;
    if (!hasPermission('PRODUCTS_VIEW')) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#991b1b' }}>Access Denied</div>;

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

            {/* Stats Dashboard */}
            {stats && (
                <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Total Products
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700 }}>{stats.totalProducts}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                {stats.activeProducts} active
                            </span>
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Stock Value
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--admin-accent)' }}>
                            {formatCurrency(stats.totalStockValue)}
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: '#b76e00', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Low Stock
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700, color: '#b76e00' }}>{stats.lowStockCount}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>products</span>
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Out of Stock
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700, color: '#991b1b' }}>{stats.outOfStockCount}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>products</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '20px' }}>
                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-accent)' }}>
                            {selectedIds.length} selected
                        </span>
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowBulkMenu(!showBulkMenu)}
                                className="admin-btn admin-btn-outline"
                                style={{ padding: '8px 14px', fontSize: '12px' }}
                            >
                                Actions ▾
                            </button>
                            {showBulkMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    marginTop: '4px',
                                    background: 'var(--admin-surface)',
                                    border: '1px solid var(--admin-border)',
                                    borderRadius: 'var(--admin-radius-sm)',
                                    boxShadow: 'var(--shadow-lg)',
                                    zIndex: 100,
                                    minWidth: '160px',
                                    overflow: 'hidden'
                                }}>
                                    <button 
                                        onClick={() => handleBulkStatus('active')}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        Set Active
                                    </button>
                                    <button 
                                        onClick={() => handleBulkStatus('draft')}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        Set Draft
                                    </button>
                                    <button 
                                        onClick={() => handleBulkStatus('archived')}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        Archive
                                    </button>
                                    <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--admin-border)' }} />
                                    <button 
                                        onClick={handleBulkDelete}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#991b1b' }}
                                    >
                                        Delete Selected
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="admin-btn admin-btn-outline"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                        >
                            Clear
                        </button>
                    </div>
                )}

                {/* Stock Tabs */}
                <div className="admin-tabs-container">
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'in_stock', label: 'In Stock' },
                        { value: 'low_stock', label: 'Low Stock' },
                        { value: 'out_of_stock', label: 'Out of Stock' },
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setStockFilter(f.value)}
                            className={`admin-tab-pill ${stockFilter === f.value ? 'active' : ''}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
                    {stats && stats.categories.length > 0 && (
                        <div style={{ minWidth: '160px' }}>
                            <AdminDropdown
                                value={categoryFilter}
                                onChange={setCategoryFilter}
                                placeholder="All Categories"
                                size="sm"
                                options={[
                                    { value: '', label: 'All Categories' },
                                    ...stats.categories.map(c => ({ value: c.id, label: `${c.name} (${c.count})` }))
                                ]}
                            />
                        </div>
                    )}
                    <div style={{ minWidth: '120px' }}>
                        <AdminDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder="All Status"
                            size="sm"
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'active', label: 'Active' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'archived', label: 'Archived' }
                            ]}
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="admin-search-wrapper" style={{ maxWidth: '250px' }}>
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="admin-search-input"
                    />
                </div>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    <div style={{ color: 'var(--admin-text-muted)' }}>Loading products...</div>
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox"
                                        checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                                        onChange={toggleSelectAll}
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ width: '60px' }}></th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const mainVariant = product.variants[0];
                                const isSelected = selectedIds.includes(product.id);
                                
                                return (
                                    <tr key={product.id} style={{ background: isSelected ? 'rgba(212, 175, 55, 0.05)' : undefined }}>
                                        <td>
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(product.id)}
                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--admin-radius-sm)', overflow: 'hidden', position: 'relative', background: '#f8f8f8' }}>
                                                {product.imageUrl ? (
                                                    <Image src={product.imageUrl} alt="" fill style={{ objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>
                                                        NO IMG
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                                                {mainVariant && <span style={{ marginLeft: '8px', fontFamily: 'monospace' }}>{mainVariant.sku}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {product.categoryName ? (
                                                <span style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--admin-radius)', fontSize: '12px' }}>
                                                    {product.categoryName}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>—</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>
                                            {mainVariant ? formatCurrency(mainVariant.price) : '—'}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '6px 12px',
                                                borderRadius: 'var(--admin-radius)',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                background: product.totalStock > 0 
                                                    ? (product.totalStock < 10 ? 'rgba(183, 110, 0, 0.1)' : 'rgba(22, 101, 52, 0.1)') 
                                                    : 'rgba(153, 27, 27, 0.1)',
                                                color: product.totalStock > 0 
                                                    ? (product.totalStock < 10 ? '#b76e00' : '#166534') 
                                                    : '#991b1b'
                                            }}>
                                                {product.totalStock > 0 ? `${product.totalStock} in stock` : 'Out of Stock'}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '4px 10px',
                                                borderRadius: 'var(--admin-radius)',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                background: product.status === 'active' ? 'rgba(22, 101, 52, 0.1)' :
                                                    product.status === 'draft' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(153, 27, 27, 0.1)',
                                                color: product.status === 'active' ? '#166534' :
                                                    product.status === 'draft' ? '#64748b' : '#991b1b'
                                            }}>
                                                {product.status}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleDuplicate(product.id)}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 10px', fontSize: '11px' }}
                                                    title="Duplicate"
                                                >
                                                    📋
                                                </button>
                                                <Link 
                                                    href={`/admin/products/${product.id}`}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 10px', fontSize: '11px', color: '#991b1b' }}
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="admin-card" style={{ padding: '80px 40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', marginBottom: '12px' }}>
                        {search ? 'No products found' : 'No products yet'}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                        {search ? 'Try adjusting your search or filters' : 'Add your first product to start selling.'}
                    </div>
                    {!search && (
                        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
                            + Create Product
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
