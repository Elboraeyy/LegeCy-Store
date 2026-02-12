'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { fetchWarehouseById, WarehouseWithStats } from '@/lib/actions/warehouse-actions';
import { fetchInventoryPro, InventoryItemPro } from '@/lib/actions/inventory-pro';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

const statusColors: Record<string, { bg: string; text: string }> = {
    IN_STOCK: { bg: '#dcfce7', text: '#166534' },
    LOW_STOCK: { bg: '#fef3c7', text: '#b76e00' },
    OUT_OF_STOCK: { bg: '#fee2e2', text: '#991b1b' },
};

export default function WarehouseStockPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const params = useParams();
    const warehouseId = params.id as string;
    
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [warehouse, setWarehouse] = useState<WarehouseWithStats | null>(null);
    const [inventory, setInventory] = useState<InventoryItemPro[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

    const loadData = useCallback(async () => {
        // Fetch warehouse details
        const warehouseData = await fetchWarehouseById(warehouseId);
        setWarehouse(warehouseData);
        
        // Fetch inventory for this warehouse
        const inventoryResult = await fetchInventoryPro({
            warehouseId,
            limit: 1000, // Get all items for this warehouse
            search,
            status: statusFilter,
        });
        if ('error' in inventoryResult) {
            console.error(inventoryResult.error);
            setInventory([]);
        } else {
            setInventory(inventoryResult.data);
        }
        
        setLoading(false);
    }, [warehouseId, search, statusFilter]);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                void loadData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadData]);

    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.inventory.loading}</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>{t.inventory.access_denied}</div>;

    const stockT = t.inventory.warehouses.stock;

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">
                        {warehouse ? stockT.title.replace('{name}', warehouse.name) : stockT.default_title}
                    </h1>
                    <p className="admin-subtitle">
                        {warehouse ? stockT.subtitle.replace('{name}', warehouse.city || warehouse.name) : stockT.default_subtitle}
                    </p>
                </div>
            </div>


            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>{t.inventory.title}</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <Link href="/admin/inventory/warehouses" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>{t.inventory.warehouses.title}</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>{stockT.breadcrumb}</span>
            </div>

            {/* Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                    
                    {/* Search */}
                    <div className="admin-search-wrapper" style={{ flex: 1, minWidth: '250px' }}>
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={stockT.toolbar.search_placeholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                            className="admin-search-input"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="admin-tabs-container">
                        <button
                            onClick={() => { setLoading(true); setStatusFilter('ALL'); }}
                            className={`admin-tab-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                        >
                            {stockT.toolbar.all}
                        </button>
                        <button
                            onClick={() => { setLoading(true); setStatusFilter('LOW_STOCK'); }}
                            className={`admin-tab-pill ${statusFilter === 'LOW_STOCK' ? 'active' : ''}`}
                        >
                            ⚠️ {stockT.toolbar.low}
                        </button>
                        <button
                            onClick={() => { setLoading(true); setStatusFilter('OUT_OF_STOCK'); }}
                            className={`admin-tab-pill ${statusFilter === 'OUT_OF_STOCK' ? 'active' : ''}`}
                        >
                            🚫 {stockT.toolbar.out}
                        </button>
                    </div>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="admin-table-container">
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                        {t.inventory.loading}
                    </div>
                ) : inventory.length > 0 ? (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}></th>
                                    <th>{stockT.table.product}</th>
                                    <th>{stockT.table.sku}</th>
                                    <th style={{ textAlign: 'center' }}>{stockT.table.available}</th>
                                    <th style={{ textAlign: 'center' }}>{stockT.table.reserved}</th>
                                    <th style={{ textAlign: 'center' }}>{stockT.table.min}</th>
                                    <th>{stockT.table.status}</th>
                                    <th style={{ textAlign: 'right' }}>{stockT.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventory.map((item) => {
                                const statusInfo = statusColors[item.status] || statusColors.IN_STOCK;
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ 
                                                width: '48px', 
                                                height: '48px', 
                                                borderRadius: '8px', 
                                                overflow: 'hidden',
                                                position: 'relative',
                                                background: '#f8f8f8'
                                            }}>
                                                {item.productImage ? (
                                                    <Image 
                                                        src={item.productImage} 
                                                        alt={item.productName} 
                                                        fill 
                                                        style={{ objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    <div style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        fontSize: '10px',
                                                        color: '#999'
                                                    }}>
                                                            {stockT.table.no_img}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                        </td>
                                        <td>
                                            <code style={{ 
                                                fontFamily: 'monospace', 
                                                fontSize: '12px',
                                                background: 'rgba(0,0,0,0.05)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>
                                                {item.sku}
                                            </code>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: '16px' }}>
                                            {item.available}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            {item.reserved}
                                        </td>
                                        <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            {item.minStock}
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: statusInfo.bg,
                                                color: statusInfo.text
                                            }}>
                                                {t.inventory.status[item.status.toLowerCase() as keyof typeof t.inventory.status] || item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <Link 
                                                href={`/admin/inventory?search=${item.sku}`}
                                                className="admin-btn admin-btn-outline"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                {stockT.table.manage}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '8px', color: 'var(--admin-text-on-light)' }}>
                                    {stockT.empty.no_products}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                            {statusFilter !== 'ALL' 
                                        ? stockT.empty.filter_desc
                                        : stockT.empty.empty_desc
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
