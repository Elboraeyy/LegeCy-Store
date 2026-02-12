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
    riskScore?: number;
    hasDispute?: boolean;
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
        const statusKey = status.toLowerCase() as keyof typeof t.orders.status;
        const label = t.orders.status[statusKey] || status;

        switch (status) {
            case OrderStatus.Paid: return { label, className: 'status-paid' };
            case OrderStatus.Confirmed: return { label, className: 'status-confirmed' };
            case OrderStatus.Preparing: return { label, className: 'status-preparing' };
            case OrderStatus.Shipped: return { label, className: 'status-shipped' };
            case OrderStatus.Delivered: return { label, className: 'status-delivered' };
            case OrderStatus.Cancelled: return { label, className: 'status-cancelled' };
            case OrderStatus.Pending: return { label, className: 'status-pending' };
            case OrderStatus.Refunded: return { label, className: 'status-warning' }; // Ensure status-warning exists or use similar
            case OrderStatus.PaymentPending: return { label, className: 'status-payment-pending' };
            default: return { label, className: 'status-default' };
        }
    };

    const getRiskIndicator = (score?: number) => {
        if (!score || score < 50) return null;
        if (score >= 80) return <span title="High Risk" style={{ color: 'var(--admin-error)', marginLeft: '8px' }}>🚨</span>;
        return <span title="Medium Risk" style={{ color: 'var(--admin-warning)', marginLeft: '8px' }}>⚠️</span>;
    };

    if (orders.length === 0) {
        return (
            <div className="admin-card" style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px', opacity: 0.5 }}>📭</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{t.common.no_notes}</h3>
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
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', background: 'var(--admin-bg-hover)', padding: '4px 8px', borderRadius: '4px' }}>
                                                #{order.id.slice(-6).toUpperCase()}
                                            </span>
                                            {getRiskIndicator(order.riskScore)}
                                            {order.hasDispute && <span title="Disputed" style={{ marginLeft: '8px' }}>⚖️</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{order.user?.name || t.orders.details.guest}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{order.user?.email || t.orders.details.no_email}</div>
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
                                                e.stopPropagation();
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
