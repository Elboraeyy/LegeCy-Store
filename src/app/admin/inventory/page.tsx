'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchInventoryPro, fetchAllWarehouses, InventoryItemPro } from '@/lib/actions/inventory-pro';
import InventoryTablePro from '@/components/admin/inventory/InventoryTablePro';
import { useRouter, useSearchParams } from 'next/navigation';

export default function InventoryPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const router = useRouter();
    const searchParams = useSearchParams();

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
        { value: 'ALL', label: 'All Stock', count: stats.totalItems },
        { value: 'IN_STOCK', label: 'In Stock', count: stats.totalItems - stats.lowStockCount - stats.outOfStockCount },
        { value: 'LOW_STOCK', label: 'Low Stock', count: stats.lowStockCount },
        { value: 'OUT_OF_STOCK', label: 'Out of Stock', count: stats.outOfStockCount },
    ];

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>Access Denied</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Stock Inventory</h1>
                    <p className="admin-subtitle">Manage stock levels across all warehouses</p>
                </div>
                <button 
                    onClick={refreshData} 
                    className="admin-btn admin-btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : '↻ Refresh'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="admin-grid" style={{ marginBottom: '32px' }}>
                <div className="admin-card">
                    <div className="stat-label">Total SKUs</div>
                    <div className="stat-value">{stats.totalItems}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">Total Units</div>
                    <div className="stat-value">{stats.totalQuantity.toLocaleString()}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">Low Stock</div>
                    <div className="stat-value" style={{ color: stats.lowStockCount > 0 ? '#b76e00' : 'inherit' }}>{stats.lowStockCount}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">Out of Stock</div>
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
                    <select 
                        value={selectedWarehouse}
                        onChange={(e) => { setSelectedWarehouse(e.target.value); updateFilters('warehouse', e.target.value); }}
                        className="form-input"
                        style={{ width: 'auto', minWidth: '180px', borderRadius: '99px', padding: '10px 16px', fontSize: '13px' }}
                    >
                        <option value="ALL">All Warehouses</option>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>

                    <div className="admin-search-wrapper">
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search SKU or Product..."
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
                    Loading inventory data...
                </div>
            ) : data.length > 0 ? (
                <InventoryTablePro data={data} onRefresh={refreshData} />
            ) : (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>No inventory found</div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>Try adjusting your filters or add products to your inventory.</div>
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
                        Previous
                    </button>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        Page {meta.page} of {meta.totalPages}
                    </span>
                    <button
                        onClick={() => updateFilters('page', (meta.page + 1).toString())}
                        className="admin-btn admin-btn-outline"
                        disabled={meta.page >= meta.totalPages}
                        style={{ opacity: meta.page >= meta.totalPages ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
