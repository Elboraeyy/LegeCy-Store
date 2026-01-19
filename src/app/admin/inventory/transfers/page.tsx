'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { getTransfersAction, createTransferAction, approveTransferAction, shipTransferAction, receiveTransferAction } from '@/lib/actions/stock-transfers';
import { toast } from 'sonner';

// Mock data helpers (replace with real fetches if needed)
const WAREHOUSES = [
    { id: 'wh-main', name: 'Main Warehouse' },
    { id: 'wh-alex', name: 'Alexandria Branch' },
    { id: 'wh-retail', name: 'Retail Store' }
];

interface Transfer {
    id: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    fromWarehouse?: { name: string };
    toWarehouse?: { name: string };
    status: string;
}

export default function StockTransfersPage() {
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);

    // Form State
    const [fromWh, setFromWh] = useState(WAREHOUSES[0].id);
    const [toWh, setToWh] = useState(WAREHOUSES[1].id);
    const [items, setItems] = useState([{ variantId: '', quantity: 1 }]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadTransfers();
    }, []);

    const loadTransfers = async () => {
        try {
            const data = await getTransfersAction();
            setTransfers(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (action: (id: string) => Promise<void>, id: string, label: string) => {
        if (!confirm(`Are you sure you want to ${label}?`)) return;
        try {
            await action(id);
            toast.success(`${label} Successful`);
            loadTransfers();
        } catch {
            toast.error(`Failed to ${label}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('fromWarehouseId', fromWh);
        formData.append('toWarehouseId', toWh);
        formData.append('notes', notes);

        items.forEach(item => {
            formData.append('variantId', item.variantId);
            formData.append('quantity', item.quantity.toString());
        });

        try {
            await createTransferAction(formData);
            toast.success('Transfer Created');
            setShowCreate(false);
            loadTransfers();
        } catch {
            toast.error('Creation Failed');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'APPROVED': return 'bg-blue-100 text-blue-800';
            case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800';
            case 'RECEIVED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="admin-page">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="admin-title">Stock Transfers</h1>
                    <p className="admin-subtitle">Move inventory between locations</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
                    + New Transfer
                </button>
            </div>

            <div className="admin-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">ID</th>
                            <th className="px-6 py-4 font-medium text-gray-500">From</th>
                            <th className="px-6 py-4 font-medium text-gray-500">To</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr> :
                            transfers.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-xs">{t.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4">{t.fromWarehouse?.name || t.fromWarehouseId}</td>
                                    <td className="px-6 py-4">{t.toWarehouse?.name || t.toWarehouseId}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(t.status)}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    {t.status === 'PENDING' && (
                                        <button onClick={() => handleAction(approveTransferAction, t.id, 'Approve')} className="text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-2 py-1 rounded">Approve</button>
                                    )}
                                    {t.status === 'APPROVED' && (
                                        <button onClick={() => handleAction(shipTransferAction, t.id, 'Ship')} className="text-xs text-purple-600 hover:text-purple-800 font-bold border border-purple-200 px-2 py-1 rounded">Ship</button>
                                    )}
                                    {t.status === 'IN_TRANSIT' && (
                                        <button onClick={() => handleAction(receiveTransferAction, t.id, 'Receive')} className="text-xs text-green-600 hover:text-green-800 font-bold border border-green-200 px-2 py-1 rounded">Receive</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Create Stock Transfer</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">From</label>
                                    <select className="w-full border rounded px-3 py-2" value={fromWh} onChange={e => setFromWh(e.target.value)}>
                                        {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">To</label>
                                    <select className="w-full border rounded px-3 py-2" value={toWh} onChange={e => setToWh(e.target.value)}>
                                        {WAREHOUSES.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Items</label>
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            placeholder="Variant ID (UUID)"
                                            className="flex-1 border rounded px-3 py-2 text-sm"
                                            value={item.variantId}
                                            onChange={e => {
                                                const newItems = [...items];
                                                newItems[idx].variantId = e.target.value;
                                                setItems(newItems);
                                            }}
                                            required
                                        />
                                        <input
                                            type="number" min="1"
                                            className="w-24 border rounded px-3 py-2 text-sm"
                                            value={item.quantity}
                                            onChange={e => {
                                                const newItems = [...items];
                                                newItems[idx].quantity = Number(e.target.value);
                                                setItems(newItems);
                                            }}
                                            required
                                        />
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 px-2">×</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setItems([...items, { variantId: '', quantity: 1 }])} className="text-sm text-blue-600 hover:underline">
                                    + Add Item
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Notes</label>
                                <textarea className="w-full border rounded px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">Create Transfer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
