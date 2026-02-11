'use client';

import { useEffect, useState, useCallback } from 'react';
import { getStockRequests, updateRequestStatus, deleteRequest } from './actions';
import Image from 'next/image';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import Link from 'next/link';

interface StockRequest {
    id: string;
    email: string | null;
    whatsapp: string | null;
    channel: string;
    status: string;
    createdAt: Date;
    product: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
    variant: {
        id: string;
        sku: string;
    } | null;
}

export default function RestockRequestsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    // Safely access nested dictionary keys with fallbacks
    const requestsT = t.inventory?.requests || {
        title: "Restock Requests",
        subtitle: "Customers waiting for out-of-stock items",
        filter_status: "Status",
        table: {
            product: "Product",
            customer: "Customer",
            channel: "Channel",
            date: "Date",
            status: "Status",
            actions: "Actions",
            variant: "Variant"
        },
        actions: {
            whatsapp: "WhatsApp",
            mark_sent: "Mark Sent",
            delete: "Delete",
            view_product: "View Product"
        },
        status: {
            pending: "Pending",
            sent: "Sent"
        },
        empty: {
            title: "No requests found",
            desc: "No customers are currently waiting for stock."
        },
        whatsapp_message: "Hello! Good news - {product} is back in stock at LegaCy Store. Order now: {link}"
    };

    const [requests, setRequests] = useState<StockRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    const loadRequests = useCallback(async () => {
        setLoading(true);
        const res = await getStockRequests();
        if (res.success && res.data) {
            setRequests(res.data as any);
        } else {
            toast.error('Failed to load requests');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleMarkSent = async (id: string) => {
        const res = await updateRequestStatus(id, 'sent');
        if (res.success) {
            toast.success('Marked as sent');
            loadRequests();
        } else {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        const res = await deleteRequest(id);
        if (res.success) {
            toast.success('Request deleted');
            loadRequests();
        } else {
            toast.error('Failed to delete');
        }
    };

    const getWhatsAppLink = (req: StockRequest) => {
        if (!req.whatsapp) return '#';
        if (typeof window === 'undefined') return '#';

        // Convert 01xxxxxxxxx to 201xxxxxxxxx
        let phone = req.whatsapp.replace(/\D/g, '');
        if (phone.startsWith('01')) {
            phone = '2' + phone;
        }

        const productUrl = `${window.location.origin}/product/${req.product.id}`;
        // Replace placeholders in message
        let message = requestsT.whatsapp_message
            .replace('{product}', req.product.name)
            .replace('{link}', productUrl);

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };


    const filteredRequests = requests.filter(r =>
        statusFilter === 'all' ? true : r.status === statusFilter
    );

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="admin-content">
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{requestsT.title}</h1>
                    <p className="admin-subtitle">{requestsT.subtitle}</p>
                </div>
                <button onClick={loadRequests} className="admin-btn admin-btn-outline">
                    🔄 Refresh
                </button>
            </div>

            <div className="admin-toolbar">
                <div className="admin-tabs-container">
                    <button
                        className={`admin-tab-pill ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        {requestsT.status.pending}
                    </button>
                    <button
                        className={`admin-tab-pill ${statusFilter === 'sent' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('sent')}
                    >
                        {requestsT.status.sent}
                    </button>
                    <button
                        className={`admin-tab-pill ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading...</div>
            ) : filteredRequests.length === 0 ? (
                <div className="admin-table-container p-12 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-serif text-gray-800 mb-2">{requestsT.empty.title}</h3>
                    <p className="text-gray-500">{requestsT.empty.desc}</p>
                </div>
            ) : (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{requestsT.table.product}</th>
                                <th>{requestsT.table.customer}</th>
                                <th>{requestsT.table.channel}</th>
                                <th>{requestsT.table.status}</th>
                                <th>{requestsT.table.date}</th>
                                <th style={{ textAlign: 'right' }}>{requestsT.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 relative rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                {(req.product.imageUrl) ? (
                                                    <Image
                                                        src={req.product.imageUrl || '/placeholder.jpg'}
                                                        alt={req.product.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">NO IMG</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">{req.product.name}</div>
                                                {req.variant && (
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {req.variant.sku}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-medium text-sm">
                                            {req.channel === 'whatsapp' ? req.whatsapp : req.email}
                                        </div>
                                    </td>
                                    <td>
                                        {req.channel === 'whatsapp' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold">
                                                📱 WhatsApp
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">
                                                ✉️ Email
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === 'sent'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {req.status === 'sent' ? requestsT.status.sent : requestsT.status.pending}
                                        </span>
                                    </td>
                                    <td className="text-xs text-gray-500">
                                        {formatDate(req.createdAt)}
                                    </td>
                                    <td className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {req.channel === 'whatsapp' && (
                                                <a
                                                    href={getWhatsAppLink(req)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="admin-btn bg-[#25D366] text-white hover:bg-[#128C7E] border-none"
                                                    style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                    title={requestsT.actions.whatsapp}
                                                >
                                                    <span>💬</span> {requestsT.actions.whatsapp}
                                                </a>
                                            )}

                                            {req.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkSent(req.id)}
                                                    className="admin-btn admin-btn-outline text-green-600 hover:bg-green-50 hover:border-green-200"
                                                    style={{ padding: '6px 12px', fontSize: '11px' }}
                                                    title={requestsT.actions.mark_sent}
                                                >
                                                    ✓
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDelete(req.id)}
                                                className="admin-btn admin-btn-outline text-red-600 hover:bg-red-50 hover:border-red-200"
                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                                title={requestsT.actions.delete}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
