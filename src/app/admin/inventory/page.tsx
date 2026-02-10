'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchInventoryPro, fetchAllWarehouses, InventoryItemPro } from '@/lib/actions/inventory-pro';
import InventoryTablePro from '@/components/admin/inventory/InventoryTablePro';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

export default function InventoryPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    // State
    const [data, setData] = useState<InventoryItemPro[]>([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(searchParams.get('warehouse') || 'ALL');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

    const [stats, setStats] = useState({
        totalItems: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalQuantity: 0
    });

    // Initial Load
    useEffect(() => {
        fetchAllWarehouses().then(setWarehouses);
    }, []);

    const refreshData = useCallback(async () => {
        setLoading(true);
        const page = parseInt(searchParams.get('page') || '1');
        
        try {
            const res = await fetchInventoryPro({
                page,
                limit: 20,
                search: searchQuery,
                warehouseId: selectedWarehouse,
                status: statusFilter === 'ALL' ? undefined : statusFilter as 'LOW_STOCK' | 'OUT_OF_STOCK'
            }) as { data: InventoryItemPro[], meta: { total: number; page: number; totalPages: number } } | { error: string };

            if ('data' in res) {
                setData(res.data);
                if (res.meta) setMeta(res.meta);
                
                const totalQty = res.data.reduce((sum: number, item: InventoryItemPro) => sum + item.available, 0);
                const low = res.data.filter((i: InventoryItemPro) => i.status === 'LOW_STOCK').length;
                const out = res.data.filter((i: InventoryItemPro) => i.status === 'OUT_OF_STOCK').length;
                
                setStats({
                    totalItems: res.meta?.total || 0,
                    lowStockCount: low,
                    outOfStockCount: out,
                    totalQuantity: totalQty
                });
            } else if ('error' in res) {
                 console.error(res.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [searchParams, searchQuery, selectedWarehouse, statusFilter]);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            refreshData();
        }
    }, [permLoading, hasPermission, refreshData]);

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== 'ALL') params.set(key, value);
        else params.delete(key);
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    // Status filter tabs
    const stockFilters = [
        { value: 'ALL', label: t.inventory.filters.all_stock, count: stats.totalItems },
        { value: 'IN_STOCK', label: t.inventory.filters.in_stock, count: stats.totalItems - stats.lowStockCount - stats.outOfStockCount },
        { value: 'LOW_STOCK', label: t.inventory.filters.low_stock, count: stats.lowStockCount },
        { value: 'OUT_OF_STOCK', label: t.inventory.filters.out_of_stock, count: stats.outOfStockCount },
    ];

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.common.loading}</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>{t.inventory.access_denied}</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.inventory.title}</h1>
                    <p className="admin-subtitle">{t.inventory.subtitle}</p>
                </div>
                <button 
                    onClick={refreshData} 
                    className="admin-btn admin-btn-primary"
                    disabled={loading}
                >
                    {loading ? t.inventory.refreshing : `↻ ${t.inventory.refresh}`}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="admin-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-card">
                    <div className="stat-label">{t.inventory.stats.total_skus}</div>
                    <div className="stat-value">{stats.totalItems}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">{t.inventory.stats.total_units}</div>
                    <div className="stat-value">{stats.totalQuantity.toLocaleString()}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">{t.inventory.stats.low_stock}</div>
                    <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? '#b76e00' : 'inherit' }}>{stats.lowStockCount}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">{t.inventory.stats.out_of_stock}</div>
                    <div className="stat-value" style={{ color: stats.outOfStockCount > 0 ? '#991b1b' : 'inherit' }}>{stats.outOfStockCount}</div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar">
                {/* Status Tabs */}
                <div className="admin-tabs-container">
                    {stockFilters.map((filter) => {
                        const isActive = statusFilter === filter.value;
                        return (
                            <button
                                key={filter.value}
                                onClick={() => { setStatusFilter(filter.value); updateFilters('status', filter.value); }}
                                className={`admin-tab-pill ${isActive ? 'active' : ''}`}
                            >
                                {filter.label}
                                <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '11px' }}>
                                    ({filter.count})
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search & Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AdminDropdown
                        value={selectedWarehouse}
                        onChange={(val) => { setSelectedWarehouse(val); updateFilters('warehouse', val); }}
                        variant="pill"
                        options={[
                            { value: 'ALL', label: t.inventory.filters.all_warehouses },
                            ...warehouses.map(w => ({ value: w.id, label: w.name }))
                        ]}
                    />

                    <div className="admin-search-wrapper">
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t.inventory.search_placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && updateFilters('q', searchQuery)}
                            className="admin-search-input"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    {t.inventory.loading}
                </div>
            ) : data.length > 0 ? (
                <InventoryTablePro data={data} onRefresh={refreshData} />
            ) : (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>{t.inventory.no_inventory}</div>
                            <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>{t.inventory.no_inventory_desc}</div>
                </div>
            )}

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <button
                        onClick={() => updateFilters('page', (meta.page - 1).toString())}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page <= 1}
                        style={{ opacity: meta.page <= 1 ? 0.5 : 1 }}
                    >
                        {t.inventory.pagination.previous}
                    </button>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        {t.inventory.pagination.page_of.replace('{page}', meta.page.toString()).replace('{total}', meta.totalPages.toString())}
                    </span>
                    <button
                        onClick={() => updateFilters('page', (meta.page + 1).toString())}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page >= meta.totalPages}
                        style={{ opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                    >
                        {t.inventory.pagination.next}
                    </button>
                </div>
            )}
        </div>
    );
}
