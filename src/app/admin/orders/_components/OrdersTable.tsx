"use client";

import { OrderStatus } from "@/lib/orderStatus";
import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { adminDictionary } from "@/lib/dictionaries/admin";

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

export default function OrdersTable({ orders, onOrderClick }: OrdersTableProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-EG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            style: 'currency',
            currency: 'EGP'
        }).format(amount);
    };

    const getStatusConfig = (status: OrderStatus) => {
        // Map OrderStatus enum/string to dictionary keys
        // We assume OrderStatus values match the keys we added in the dictionary (lowercase or mapped)
        // If OrderStatus is PascalCase or Uppercase, we might need normalization.
        // For safety, we map specific enum values if known, or use dynamic access if consistent.

        // Let's rely on the lowercase version of the status as the key, 
        // assuming standard status strings like 'pending', 'paid', 'payment_failed'.
        // If OrderStatus uses different strings, we might default to common text.

        const statusKey = status.toLowerCase() as keyof typeof t.orders.status;
        const label = t.orders.status[statusKey] || status;

        switch (status) {
            case OrderStatus.Paid: return { label, className: 'status-success' };
            case OrderStatus.Shipped: return { label, className: 'status-shipped' };
            case OrderStatus.Delivered: return { label, className: 'status-success' };
            case OrderStatus.Cancelled: return { label, className: 'status-cancelled' };
            case OrderStatus.PaymentPending: return { label, className: 'status-warning' };
            case OrderStatus.PaymentFailed: return { label, className: 'status-cancelled' };
            case OrderStatus.Pending: return { label, className: 'status-pending' };
            case 'partially_refunded' as OrderStatus: return { label, className: 'status-warning' };
            case 'refunded' as OrderStatus: return { label, className: 'status-warning' };
            default: return { label, className: 'status-default' };
        }
    };

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
                            <th style={{ paddingLeft: '24px' }}>{t.orders.table.id}</th>
                            <th>{t.orders.table.customer}</th>
                            <th>{t.orders.table.status}</th>
                            <th>{t.orders.table.total}</th>
                            <th>{t.orders.table.date}</th>
                            <th style={{ textAlign: 'right', paddingRight: '24px' }}>{t.orders.table.actions}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => {
                            const config = getStatusConfig(order.status);

                            return (
                                <tr 
                                    key={order.id} 
                                    onClick={() => onOrderClick(order.id)}
                                    className="table-row-hover"
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td style={{ paddingLeft: '24px' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', background: 'var(--admin-bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>
                                            #{order.id.slice(-6)}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.user?.name || 'Guest User'}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email || 'No email'}</div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${config.className}`}>
                                            {config.label}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', fontSize: '15px' }}>
                                        {formatCurrency(order.totalPrice)}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                            {formatDate(order.createdAt)}
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
                                            {t.common.view}
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
