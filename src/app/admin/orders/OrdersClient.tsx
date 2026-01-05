"use client";

import { useState } from "react";
import { OrderStatus } from "@/lib/orderStatus";
import OrdersStats from "./_components/OrdersStats";
import OrdersTable from "./_components/OrdersTable";
import OrdersBoard from "./_components/OrdersBoard";
import OrderPreviewSheet from "./_components/OrderPreviewSheet";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// Define types locally if not exported, or import them. 
// Ideally we share types, but for speed I'm defining compatible Interfaces.
interface Order {
    id: string;
    totalPrice: number; // Converted number
    status: OrderStatus;
    createdAt: string; // ISO String
    user?: { name: string | null; email: string | null };
}

interface OrdersClientProps {
    initialOrders: Order[];
    stats: {
        totalOrders: number;
        pendingOrders: number;
        failedPayments: number;
        monthlyRevenue: number;
    };
}

export default function OrdersClient({ initialOrders, stats }: OrdersClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // View State
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
        
        // Reset page on search
        params.delete('page');
        
        router.push(`/admin/orders?${params.toString()}`);
    };

    const statusFilters = [
        { value: '', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Orders Management</h1>
                    <p className="admin-subtitle">Track and fulfill customer orders</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="admin-tabs">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`admin-tab-item ${viewMode === 'list' ? 'active' : ''}`}
                        >
                            List View
                        </button>
                        <button 
                            onClick={() => setViewMode('board')}
                            className={`admin-tab-item ${viewMode === 'board' ? 'active' : ''}`}
                        >
                            Board View
                        </button>
                    </div>
                    <Link href="/admin/orders/export" className="admin-btn admin-btn-outline">
                        <span>⬇️</span> Export CSV
                    </Link>
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
                                href={`/admin/orders${filter.value ? `?status=${filter.value}` : ''}`}
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
                        placeholder="Search IDs or Customers..."
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
                    router.refresh(); // Refresh server data
                }}
            />
        </div>
    );
}
