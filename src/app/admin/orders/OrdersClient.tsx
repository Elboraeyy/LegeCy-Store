"use client";

import { useState, useMemo } from "react";
import { Order } from "@/types/order";
import OrdersStats from "./_components/OrdersStats";
import OrdersTable from "./_components/OrdersTable";
import OrdersBoard from "./_components/OrdersBoard";
import OrderPreviewSheet from "./_components/OrderPreviewSheet";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { adminDictionary } from "@/lib/dictionaries/admin";

interface OrdersClientProps {
    initialOrders: Order[];
    stats: {
        totalOrders: number;
        pendingOrders: number;
        deliveredOrders: number;
        monthlyRevenue: number;
    };
}

type OrderView = 'all' | 'issues' | 'returns';

export default function OrdersClient({ initialOrders, stats }: OrdersClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // View State
    const currentView = (searchParams.get('view') as OrderView) || 'all';
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Filters State derived from URL
    const currentStatus = searchParams.get('status') || '';
    const currentSearch = searchParams.get('search') || '';

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const search = formData.get('search') as string;
        
        const params = new URLSearchParams(searchParams);
        if (search) params.set('search', search);
        else params.delete('search');
        params.delete('page');
        
        router.push(`/admin/orders?${params.toString()}`);
    };

    const setView = (view: OrderView) => {
        const params = new URLSearchParams(searchParams);
        if (view === 'all') params.delete('view');
        else params.set('view', view);

        // Reset status filters when switching views
        params.delete('status');
        params.delete('page');
        
        router.push(`/admin/orders?${params.toString()}`);
    };

    const statusFilters = useMemo(() => {
        if (currentView === 'all') {
            return [
                { value: '', label: t.orders.status.all },
                { value: 'payment_pending', label: t.orders.status.payment_pending },
                { value: 'pending', label: t.orders.status.pending },
                { value: 'confirmed', label: t.orders.status.confirmed },
                { value: 'preparing', label: t.orders.status.preparing },
                { value: 'shipped', label: t.orders.status.shipped },
                { value: 'delivered', label: t.orders.status.delivered },
                { value: 'cancelled', label: t.orders.status.cancelled },
            ];
        }
        if (currentView === 'issues') {
            return [
                { value: '', label: 'All Issues' },
                { value: 'high_risk', label: 'High Risk' },
                { value: 'disputed', label: 'Disputed' },
            ];
        }
        return [];
    }, [currentView, t.orders.status]);

    // View Tabs Configuration
    const viewTabs = [
        { id: 'all', label: t.orders.status.all, icon: '📦' },
        { id: 'issues', label: 'Issues', icon: '⚠️' },
        { id: 'returns', label: t.orders.returns.title, icon: '↩️' },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.orders.title}</h1>
                    <p className="admin-subtitle">{t.orders.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="admin-tabs">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`admin-tab-item ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            {t.orders.list_view}
                        </button>
                        <button 
                            onClick={() => setViewMode('board')}
                            className={`admin-tab-item ${viewMode === 'board' ? 'active' : ''}`}
                        >
                            {t.orders.board_view}
                        </button>
                    </div>
                    <Link href="/admin/orders/create" className="admin-btn admin-btn-primary">
                        + {t.orders.create.create_order}
                    </Link>
                </div>
            </div>

            {/* Smart View Tabs - NEW COMMAND CENTER UI */}
            <div className="admin-card" style={{ marginBottom: '24px', padding: '12px' }}>
                <div className="admin-tabs-container" style={{ borderBottom: 'none' }}>
                    {viewTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id as OrderView)}
                            className={`admin-tab-pill ${currentView === tab.id ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <OrdersStats stats={stats} />

            {/* Filters Toolbar */}
            <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
                <div className="admin-tabs-container">
                    {statusFilters.map((filter) => {
                        const isActive = currentStatus === filter.value;
                        return (
                            <Link
                                key={filter.value}
                                href={`/admin/orders?view=${currentView}${filter.value ? `&status=${filter.value}` : ''}`}
                                className={`admin-tab-pill ${isActive ? 'active' : ''}`}
                            >
                                {filter.label}
                            </Link>
                        );
                    })}
                </div>

                <form onSubmit={handleSearch} className="admin-search-wrapper">
                    <span className="admin-search-icon">🔍</span>
                    <input
                        type="text"
                        name="search"
                        placeholder={t.orders.search_placeholder}
                        defaultValue={currentSearch}
                        className="admin-search-input"
                        autoComplete="off"
                    />
                </form>
            </div>

            {/* Content Area */}
            {viewMode === 'list' ? (
                <OrdersTable 
                    orders={initialOrders} 
                    onOrderClick={setSelectedOrderId}
                />
            ) : (
                <OrdersBoard 
                    orders={initialOrders} 
                    onOrderClick={setSelectedOrderId}
                />
            )}

            {/* Preview Drawer */}
            <OrderPreviewSheet 
                orderId={selectedOrderId} 
                onClose={() => setSelectedOrderId(null)}
                onUpdate={() => {
                    router.refresh();
                }}
            />
        </div>
    );
}
