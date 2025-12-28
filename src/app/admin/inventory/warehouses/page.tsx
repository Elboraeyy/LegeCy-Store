'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchWarehouses, deleteWarehouse, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import WarehouseFormDialog from '@/components/admin/inventory/WarehouseFormDialog';
import Link from 'next/link';
import { toast } from 'sonner';

const warehouseTypes: Record<string, { label: string; color: string }> = {
    MAIN: { label: 'Main', color: '#166534' },
    REGIONAL: { label: 'Regional', color: '#1e40af' },
    DROPSHIP: { label: 'Dropship', color: '#7c3aed' },
    RETURNS: { label: 'Returns', color: '#b76e00' },
};

export default function WarehousesPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [warehouses, setWarehouses] = useState<WarehouseWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<WarehouseWithStats | null>(null);

    const loadWarehouses = useCallback(async () => {
        const data = await fetchWarehouses();
        setWarehouses(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                void loadWarehouses();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadWarehouses]);

    const handleDelete = async (warehouse: WarehouseWithStats) => {
        if (!confirm(`Are you sure you want to delete "${warehouse.name}"?`)) return;
        
        const res = await deleteWarehouse(warehouse.id);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success('Warehouse deleted successfully');
            setLoading(true);
            loadWarehouses();
        }
    };

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>Access Denied</div>;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Warehouses</h1>
                    <p className="admin-subtitle">Manage storage locations and their settings</p>
                </div>
                <button 
                    onClick={() => { setEditingWarehouse(null); setShowForm(true); }}
                    className="admin-btn admin-btn-primary"
                >
                    + Add Warehouse
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>Inventory</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>Warehouses</span>
            </div>

            {/* Warehouse Cards */}
            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    Loading warehouses...
                </div>
            ) : warehouses.length > 0 ? (
                <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                    {warehouses.map((warehouse) => {
                        const typeInfo = warehouseTypes[warehouse.type] || warehouseTypes.MAIN;
                        return (
                            <div key={warehouse.id} className="admin-card" style={{ position: 'relative' }}>
                                {/* Type Badge */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '16px', 
                                    right: '16px',
                                    padding: '4px 12px',
                                    borderRadius: '99px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    background: `${typeInfo.color}15`,
                                    color: typeInfo.color,
                                    border: `1px solid ${typeInfo.color}30`
                                }}>
                                    {typeInfo.label}
                                </div>

                                {/* Header */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h3 style={{ 
                                        fontFamily: 'Playfair Display, serif', 
                                        fontSize: '22px', 
                                        margin: 0,
                                        color: 'var(--admin-text-on-light)'
                                    }}>
                                        {warehouse.name}
                                    </h3>
                                    {warehouse.code && (
                                        <span style={{ 
                                            fontFamily: 'monospace', 
                                            fontSize: '12px', 
                                            color: 'var(--admin-text-muted)',
                                            background: 'rgba(0,0,0,0.05)',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {warehouse.code}
                                        </span>
                                    )}
                                </div>

                                {/* Stats Grid */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(4, 1fr)', 
                                    gap: '12px',
                                    marginBottom: '20px',
                                    padding: '16px',
                                    background: 'var(--admin-surface-light)',
                                    borderRadius: '12px'
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>
                                            {warehouse.totalItems}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            SKUs
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>
                                            {warehouse.totalQuantity.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Units
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: warehouse.lowStockCount > 0 ? '#b76e00' : 'var(--admin-text-on-light)' }}>
                                            {warehouse.lowStockCount}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Low
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: warehouse.outOfStockCount > 0 ? '#991b1b' : 'var(--admin-text-on-light)' }}>
                                            {warehouse.outOfStockCount}
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Out
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Manager */}
                                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '20px' }}>
                                    {warehouse.address && (
                                        <div style={{ marginBottom: '4px' }}>
                                            📍 {warehouse.city ? `${warehouse.city}, ` : ''}{warehouse.address}
                                        </div>
                                    )}
                                    {warehouse.managerName && (
                                        <div>
                                            👤 Managed by <strong style={{ color: 'var(--admin-text-on-light)' }}>{warehouse.managerName}</strong>
                                        </div>
                                    )}
                                    {warehouse.phone && (
                                        <div style={{ marginTop: '4px' }}>
                                            📞 {warehouse.phone}
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => { setEditingWarehouse(warehouse); setShowForm(true); }}
                                        className="admin-btn admin-btn-outline"
                                        style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                                    >
                                        Edit
                                    </button>
                                    <Link
                                        href={`/admin/inventory/warehouses/${warehouse.id}/stock`}
                                        className="admin-btn admin-btn-outline"
                                        style={{ flex: 1, padding: '10px', fontSize: '12px', textAlign: 'center' }}
                                    >
                                        View Stock
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(warehouse)}
                                        className="admin-btn admin-btn-outline"
                                        style={{ padding: '10px', fontSize: '12px', color: '#991b1b', borderColor: '#991b1b30' }}
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏭</div>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                        No warehouses yet
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '24px' }}>
                        Create your first warehouse to start managing inventory.
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="admin-btn admin-btn-primary"
                    >
                        + Create Warehouse
                    </button>
                </div>
            )}

            {/* Form Dialog */}
            {showForm && (
                <WarehouseFormDialog
                    warehouse={editingWarehouse}
                    onClose={() => { setShowForm(false); setEditingWarehouse(null); }}
                    onSuccess={() => { setShowForm(false); setEditingWarehouse(null); setLoading(true); loadWarehouses(); }}
                />
            )}
        </div>
    );
}
