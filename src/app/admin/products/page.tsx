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
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

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
    threshold: number;
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    
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
    const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

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
                    acc + v.inventory.reduce((sum, i) => sum + i.available, 0), 0),
                threshold: (p as any).threshold ?? 3
            }));
            
            setProducts(transformed);
        } catch (error) {
            console.error('Failed to load products:', error);
            toast.error(t.products.messages.failed_load);
        }
        setLoading(false);
    }, [t.products]);

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
        else if (stockFilter === 'low_stock') matchesStock = product.totalStock > 0 && product.totalStock <= product.threshold;
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
        if (!confirm(t.products.actions.delete + '?')) return;
        const res = await deleteProductAction(id);
        if (res.success) {
            toast.success(t.products.messages.deleted);
            setLoading(true);
            loadData();
        } else {
            toast.error(res.error || t.products.messages.failed_delete);
        }
    };

    const handleDuplicate = async (id: string) => {
        const res = await duplicateProduct(id);
        if (res.success) {
            toast.success(t.products.messages.duplicated);
            router.push(`/admin/products/${res.newId}`);
        } else {
            toast.error(res.error || t.products.messages.failed_duplicate);
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

    const handleSingleStatusChange = async (productId: string, newStatus: string) => {
        setStatusDropdownId(null);
        try {
            await bulkUpdateStatus([productId], newStatus);
            // Optimistic update
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, status: newStatus } : p));
            toast.success(`Status updated to ${newStatus}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    if (permLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>{t.common.loading}</div>;
    if (!hasPermission('PRODUCTS_VIEW')) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#991b1b' }}>{t.inventory.access_denied}</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.products.title}</h1>
                    <p className="admin-subtitle">{t.products.subtitle}</p>
                </div>
                <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
                    + {t.products.add_product}
                </Link>
            </div>

            {/* Stats Dashboard */}
            {stats && (
                <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t.products.stats.total_products}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700 }}>{stats.totalProducts}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                                {stats.activeProducts} {t.products.stats.active}
                            </span>
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t.products.stats.stock_value}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--admin-accent)' }}>
                            {formatCurrency(stats.totalStockValue)}
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: '#b76e00', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t.products.stats.low_stock}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700, color: '#b76e00' }}>{stats.lowStockCount}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{t.products.stats.products}</span>
                        </div>
                    </div>
                    <div className="admin-card" style={{ padding: '22px' }}>
                        <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t.products.stats.out_of_stock}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '32px', fontWeight: 700, color: '#991b1b' }}>{stats.outOfStockCount}</span>
                            <span style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>{t.products.stats.products}</span>
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
                            {selectedIds.length} {t.products.bulk.selected}
                        </span>
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowBulkMenu(!showBulkMenu)}
                                className="admin-btn admin-btn-outline"
                                style={{ padding: '8px 14px', fontSize: '12px' }}
                            >
                                {t.products.bulk.actions} ▾
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
                                        {t.products.bulk.set_active}
                                    </button>
                                    <button 
                                        onClick={() => handleBulkStatus('draft')}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        {t.products.bulk.set_draft}
                                    </button>
                                    <button 
                                        onClick={() => handleBulkStatus('archived')}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                                    >
                                        {t.products.bulk.archive}
                                    </button>
                                    <hr style={{ margin: 0, border: 'none', borderTop: '1px solid var(--admin-border)' }} />
                                    <button 
                                        onClick={handleBulkDelete}
                                        style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', color: '#991b1b' }}
                                    >
                                        {t.products.bulk.delete_selected}
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="admin-btn admin-btn-outline"
                            style={{ padding: '8px 12px', fontSize: '12px' }}
                        >
                            {t.products.bulk.clear}
                        </button>
                    </div>
                )}

                {/* Stock Tabs */}
                <div className="admin-tabs-container">
                    {[
                        { value: 'all', label: t.products.filters.all },
                        { value: 'in_stock', label: t.products.filters.in_stock },
                        { value: 'low_stock', label: t.products.filters.low_stock },
                        { value: 'out_of_stock', label: t.products.filters.out_of_stock },
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
                                placeholder={t.products.filters.all_categories}
                                size="sm"
                                options={[
                                    { value: '', label: t.products.filters.all_categories },
                                    ...stats.categories.map(c => ({ value: c.id, label: `${c.name} (${c.count})` }))
                                ]}
                            />
                        </div>
                    )}
                    <div style={{ minWidth: '120px' }}>
                        <AdminDropdown
                            value={statusFilter}
                            onChange={setStatusFilter}
                            placeholder={t.products.filters.all_status}
                            size="sm"
                            options={[
                                { value: '', label: t.products.filters.all_status },
                                { value: 'active', label: t.products.filters.active },
                                { value: 'draft', label: t.products.filters.draft },
                                { value: 'archived', label: t.products.filters.archived }
                            ]}
                        />
                    </div>
                </div>

                {/* Search */}
                <div className="admin-search-wrapper" style={{ maxWidth: '250px' }}>
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder={t.products.search_placeholder}
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
                    <div style={{ color: 'var(--admin-text-muted)' }}>{t.products.loading}</div>
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
                                    <th>{t.products.table.product}</th>
                                    <th>{t.products.table.category}</th>
                                    <th>{t.products.table.price}</th>
                                    <th>{t.products.table.stock}</th>
                                    <th>{t.products.table.status}</th>
                                    <th style={{ textAlign: 'right' }}>{t.products.table.actions}</th>
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
                                                            {t.products.table.no_image}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                {product.variants.length} {product.variants.length !== 1 ? t.products.table.variants_plural : t.products.table.variants}
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
                                                    ? (product.totalStock <= product.threshold ? 'rgba(183, 110, 0, 0.1)' : 'rgba(22, 101, 52, 0.1)') 
                                                    : 'rgba(153, 27, 27, 0.1)',
                                                color: product.totalStock > 0 
                                                    ? (product.totalStock <= product.threshold ? '#b76e00' : '#166534') 
                                                    : '#991b1b'
                                            }}>
                                                {product.totalStock > 0 ? `${product.totalStock} ${t.products.table.in_stock}` : t.products.stats.out_of_stock}
                                            </span>
                                        </td>
                                        <td style={{ position: 'relative' }}>
                                            <span
                                                onClick={() => setStatusDropdownId(statusDropdownId === product.id ? null : product.id)}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 10px',
                                                    borderRadius: 'var(--admin-radius)',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.15s',
                                                    background: product.status === 'active' ? 'rgba(22, 101, 52, 0.1)' :
                                                        product.status === 'draft' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(153, 27, 27, 0.1)',
                                                    color: product.status === 'active' ? '#166534' :
                                                        product.status === 'draft' ? '#64748b' : '#991b1b'
                                                }}
                                            >
                                                {product.status}
                                                <span style={{ fontSize: '8px', opacity: 0.7 }}>▼</span>
                                            </span>
                                            {statusDropdownId === product.id && (
                                                <>
                                                    <div
                                                        onClick={() => setStatusDropdownId(null)}
                                                        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                                                    />
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
                                                        minWidth: '130px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {[
                                                            { value: 'active', label: 'Active', color: '#166534', bg: 'rgba(22, 101, 52, 0.08)' },
                                                            { value: 'draft', label: 'Draft', color: '#64748b', bg: 'rgba(100, 116, 139, 0.08)' },
                                                            { value: 'archived', label: 'Archived', color: '#991b1b', bg: 'rgba(153, 27, 27, 0.08)' },
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => handleSingleStatusChange(product.id, opt.value)}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    width: '100%',
                                                                    padding: '9px 14px',
                                                                    textAlign: 'left',
                                                                    border: 'none',
                                                                    background: product.status === opt.value ? opt.bg : 'none',
                                                                    cursor: product.status === opt.value ? 'default' : 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: product.status === opt.value ? 700 : 500,
                                                                    color: opt.color,
                                                                    opacity: product.status === opt.value ? 1 : 0.85,
                                                                }}
                                                                disabled={product.status === opt.value}
                                                            >
                                                                <span style={{
                                                                    width: '7px',
                                                                    height: '7px',
                                                                    borderRadius: '50%',
                                                                    background: opt.color,
                                                                }} />
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleDuplicate(product.id)}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 10px', fontSize: '11px' }}
                                                    title={t.products.actions.duplicate}
                                                >
                                                    📋
                                                </button>
                                                <Link 
                                                    href={`/admin/products/${product.id}`}
                                                    className="admin-btn admin-btn-outline"
                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                >
                                                    {t.products.actions.edit}
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
                                {search ? t.products.empty.no_found : t.products.empty.no_yet}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                                {search ? t.products.empty.adjust_filters : t.products.empty.add_first}
                    </div>
                    {!search && (
                        <Link href="/admin/products/new" className="admin-btn admin-btn-primary">
                                    + {t.products.empty.create_product}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
