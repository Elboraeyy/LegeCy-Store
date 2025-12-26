'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

interface InventoryItem {
    id: string;
    sku: string;
    productName: string;
    available: number;
    reserved: number;
    warehouseId: string;
    warehouseName: string;
    variantId: string;
    updatedAt: string;
}

interface InventoryMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function InventoryPage() {
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [meta, setMeta] = useState<InventoryMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Adjustment Modal State
    const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
    const [adjustQty, setAdjustQty] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustLoading, setAdjustLoading] = useState(false);
    const [adjustError, setAdjustError] = useState<string | null>(null);

    const fetchInventory = useCallback(async (p: number) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/inventory?page=${p}&limit=20`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch');
            }
            const data = await res.json();
            setInventory(data.data);
            setMeta(data.meta);
            setPage(p);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            fetchInventory(1);
        }
    }, [permLoading, hasPermission, fetchInventory]);

    const handleAdjust = async () => {
        if (!adjustItem || adjustQty === 0 || !adjustReason.trim()) return;
        
        setAdjustLoading(true);
        setAdjustError(null);
        try {
            const res = await fetch('/api/admin/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    variantId: adjustItem.variantId,
                    warehouseId: adjustItem.warehouseId,
                    quantity: adjustQty,
                    reason: adjustReason.trim()
                })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Adjustment failed');
            }
            setAdjustItem(null);
            setAdjustQty(0);
            setAdjustReason('');
            fetchInventory(page);
        } catch (err) {
            setAdjustError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setAdjustLoading(false);
        }
    };

    if (permLoading) {
        return <div className="p-8 text-gray-400">Loading...</div>;
    }

    if (!hasPermission('INVENTORY_MANAGE')) {
        return <div className="p-8 text-red-500">Access Denied. You do not have permission to manage inventory.</div>;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-8" style={{ color: 'var(--text-on-dark)' }}>Inventory Management</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="rounded-lg border shadow-sm overflow-hidden" style={{ 
                backgroundColor: 'var(--surface-glass)', 
                borderColor: 'var(--border)',
                backdropFilter: 'blur(10px)'
            }}>
                <table className="w-full text-sm text-left">
                    <thead className="border-b" style={{ borderColor: 'var(--border)', color: 'var(--text-muted-dark)' }}>
                        <tr>
                            <th className="px-6 py-4 font-medium">SKU</th>
                            <th className="px-6 py-4 font-medium">Product</th>
                            <th className="px-6 py-4 font-medium">Warehouse</th>
                            <th className="px-6 py-4 font-medium text-right">Available</th>
                            <th className="px-6 py-4 font-medium text-right">Reserved</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted-dark)' }}>
                                    Loading inventory...
                                </td>
                            </tr>
                        ) : inventory.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--text-muted-dark)' }}>
                                    No inventory found.
                                </td>
                            </tr>
                        ) : (
                            inventory.map((item) => (
                                <tr key={item.id} className="transition hover:bg-white/5" style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td className="px-6 py-4 font-mono text-xs" style={{ color: 'var(--text-on-dark)' }}>
                                        {item.sku}
                                    </td>
                                    <td className="px-6 py-4" style={{ color: 'var(--text-on-dark)' }}>
                                        {item.productName}
                                    </td>
                                    <td className="px-6 py-4" style={{ color: 'var(--text-muted-dark)' }}>
                                        {item.warehouseName}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold" style={{ color: item.available > 0 ? '#22c55e' : '#ef4444' }}>
                                        {item.available}
                                    </td>
                                    <td className="px-6 py-4 text-right" style={{ color: 'var(--text-muted-dark)' }}>
                                        {item.reserved}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setAdjustItem(item); setAdjustQty(0); setAdjustReason(''); setAdjustError(null); }}
                                            className="px-3 py-1 text-xs font-medium rounded"
                                            style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                                        >
                                            Adjust
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4" style={{ color: 'var(--text-muted-dark)' }}>
                    <span>Page {meta.page} of {meta.totalPages} ({meta.total} items)</span>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => fetchInventory(page - 1)}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            Prev
                        </button>
                        <button
                            disabled={page >= meta.totalPages}
                            onClick={() => fetchInventory(page + 1)}
                            className="px-3 py-1 rounded border disabled:opacity-50"
                            style={{ borderColor: 'var(--border)' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Adjustment Modal */}
            {adjustItem && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Adjust Inventory</h2>
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">SKU: <strong>{adjustItem.sku}</strong></p>
                            <p className="text-sm text-gray-600">Current: <strong>{adjustItem.available}</strong> available</p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Change (+/-)</label>
                            <input
                                type="number"
                                value={adjustQty}
                                onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="e.g. 10 or -5"
                            />
                            {adjustQty !== 0 && (
                                <p className="text-sm mt-1" style={{ color: adjustQty > 0 ? 'green' : 'red' }}>
                                    New total: {adjustItem.available + adjustQty}
                                </p>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Required)</label>
                            <textarea
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="e.g. Received new shipment"
                                rows={2}
                            />
                        </div>

                        {adjustError && (
                            <div className="text-red-600 text-sm mb-4">{adjustError}</div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setAdjustItem(null)}
                                className="px-4 py-2 border rounded"
                                disabled={adjustLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjust}
                                disabled={adjustLoading || adjustQty === 0 || !adjustReason.trim()}
                                className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
                            >
                                {adjustLoading ? 'Saving...' : 'Confirm Adjustment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
