"use client";

import { OrderStatus } from "@/lib/orderStatus";
import { formatCurrency } from "../../../../lib/utils";
import React from "react";

interface Order {
    id: string;
    totalPrice: number;
    status: OrderStatus;
    createdAt: string;
    user?: { name: string | null; email: string | null };
}

interface OrdersTableProps {
    orders: Order[];
    onOrderClick: (orderId: string) => void;
}

const getStatusClass = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.Paid: return 'status-paid';
        case OrderStatus.Shipped: return 'status-shipped';
        case OrderStatus.Delivered: return 'status-delivered';
        case OrderStatus.Cancelled: return 'status-cancelled';
        case OrderStatus.Pending: return 'status-pending';
        default: return 'status-pending';
    }
};

export default function OrdersTable({ orders, onOrderClick }: OrdersTableProps) {
    if (orders.length === 0) {
        return (
            <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>📭</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>No orders found</h3>
                <p style={{ color: 'var(--admin-text-muted)', margin: 0 }}>Try adjusting your search or filters</p>
            </div>
        );
    }

    return (
        <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '24px' }}>Order ID</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const statusClass = getStatusClass(order.status);
                            return (
                                <tr 
                                    key={order.id} 
                                    onClick={() => onOrderClick(order.id)}
                                    style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    <td style={{ paddingLeft: '24px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', background: 'var(--admin-bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>
                                            #{order.id.slice(0, 8)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.user?.name || 'Guest User'}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email || 'No email'}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${statusClass}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
                                        {formatCurrency(order.totalPrice)}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                                        <button 
                                            className="admin-btn admin-btn-outline" 
                                            style={{ padding: '6px 12px', fontSize: '12px' }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click
                                                onOrderClick(order.id);
                                            }}
                                        >
                                            Quick View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
