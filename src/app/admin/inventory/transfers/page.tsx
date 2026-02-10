'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { getTransfersAction, createTransferAction, approveTransferAction, shipTransferAction, receiveTransferAction } from '@/lib/actions/stock-transfers';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import { fetchAllWarehouses } from '@/lib/actions/inventory-pro';

interface Transfer {
    id: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    fromWarehouse?: { name: string };
    toWarehouse?: { name: string };
    status: string;
}

export default function StockTransfersPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);

    // Form State
    const [fromWh, setFromWh] = useState('');
    const [toWh, setToWh] = useState('');
    const [items, setItems] = useState([{ variantId: '', quantity: 1 }]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [transfersData, warehousesData] = await Promise.all([
                getTransfersAction(),
                fetchAllWarehouses()
            ]);
            setTransfers(transfersData);
            setWarehouses(warehousesData);
            if (warehousesData.length > 0) {
                setFromWh(warehousesData[0].id);
                if (warehousesData.length > 1) setToWh(warehousesData[1].id);
                else setToWh(warehousesData[0].id);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAction = async (action: (id: string) => Promise<void>, id: string, label: string) => {
        if (!confirm(t.inventory.transfers_page.actions.confirm_title.replace('{action}', label))) return;
        try {
            await action(id);
            toast.success(t.inventory.transfers_page.actions.success.replace('{action}', label));
            const data = await getTransfersAction();
            setTransfers(data);
        } catch {
            toast.error(t.inventory.transfers_page.actions.failed.replace('{action}', label));
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
            toast.success(t.inventory.transfers_page.create.success);
            setShowCreate(false);
            const data = await getTransfersAction();
            setTransfers(data);
        } catch {
            toast.error(t.inventory.transfers_page.create.failed);
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PENDING': return t.inventory.transfers_page.status.pending;
            case 'APPROVED': return t.inventory.transfers_page.status.approved;
            case 'IN_TRANSIT': return t.inventory.transfers_page.status.in_transit;
            case 'RECEIVED': return t.inventory.transfers_page.status.received;
            default: return status;
        }
    };

    return (
        <div className="admin-page">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="admin-title">{t.inventory.transfers_page.title}</h1>
                    <p className="admin-subtitle">{t.inventory.transfers_page.subtitle}</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowCreate(true)}>
                    + {t.inventory.transfers_page.new_transfer}
                </button>
            </div>

            <div className="admin-card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.inventory.transfers_page.table.id}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.inventory.transfers_page.table.from}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.inventory.transfers_page.table.to}</th>
                            <th className="px-6 py-4 font-medium text-gray-500">{t.inventory.transfers_page.table.status}</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">{t.inventory.transfers_page.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">{t.inventory.loading}</td></tr> :
                            transfers.map(tr => (
                                <tr key={tr.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-xs">{tr.id.substring(0, 8)}</td>
                                    <td className="px-6 py-4">{tr.fromWarehouse?.name || tr.fromWarehouseId}</td>
                                    <td className="px-6 py-4">{tr.toWarehouse?.name || tr.toWarehouseId}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(tr.status)}`}>
                                            {getStatusLabel(tr.status)}
                                        </span>
                                    </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                        {tr.status === 'PENDING' && (
                                            <button onClick={() => handleAction(approveTransferAction, tr.id, t.inventory.transfers_page.actions.approve)} className="text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-2 py-1 rounded">{t.inventory.transfers_page.actions.approve}</button>
                                    )}
                                        {tr.status === 'APPROVED' && (
                                            <button onClick={() => handleAction(shipTransferAction, tr.id, t.inventory.transfers_page.actions.ship)} className="text-xs text-purple-600 hover:text-purple-800 font-bold border border-purple-200 px-2 py-1 rounded">{t.inventory.transfers_page.actions.ship}</button>
                                    )}
                                        {tr.status === 'IN_TRANSIT' && (
                                            <button onClick={() => handleAction(receiveTransferAction, tr.id, t.inventory.transfers_page.actions.receive)} className="text-xs text-green-600 hover:text-green-800 font-bold border border-green-200 px-2 py-1 rounded">{t.inventory.transfers_page.actions.receive}</button>
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
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <h2 className="text-xl font-bold mb-4">{t.inventory.transfers_page.create.title}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.inventory.transfers_page.create.from}</label>
                                    <select className="w-full border rounded px-3 py-2" value={fromWh} onChange={e => setFromWh(e.target.value)}>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t.inventory.transfers_page.create.to}</label>
                                    <select className="w-full border rounded px-3 py-2" value={toWh} onChange={e => setToWh(e.target.value)}>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">{t.inventory.transfers_page.create.items}</label>
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <input
                                            placeholder={t.inventory.transfers_page.create.variant_id}
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
                                    {t.inventory.transfers_page.create.add_item}
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t.inventory.transfers_page.create.notes}</label>
                                <textarea className="w-full border rounded px-3 py-2" value={notes} onChange={e => setNotes(e.target.value)} rows={3}></textarea>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">{t.inventory.transfers_page.create.cancel}</button>
                                <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800">{t.inventory.transfers_page.create.create_btn}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
