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

interface OrdersBoardProps {
    orders: Order[];
    onOrderClick: (orderId: string) => void;
}

const COLUMNS: { id: OrderStatus; label: string; color: string }[] = [
    { id: OrderStatus.Pending, label: 'Pending', color: '#f59e0b' },
    { id: OrderStatus.Paid, label: 'Paid', color: '#3b82f6' },
    { id: OrderStatus.Shipped, label: 'Shipped', color: '#8b5cf6' },
    { id: OrderStatus.Delivered, label: 'Delivered', color: '#10b981' },
    { id: OrderStatus.Cancelled, label: 'Cancelled', color: '#ef4444' },
];

export default function OrdersBoard({ orders, onOrderClick }: OrdersBoardProps) {
    const getOrdersByStatus = (status: OrderStatus) => {
        return orders.filter(o => o.status === status);
    };

    return (
        <div style={{ 
            display: 'flex', 
            gap: '24px', 
            overflowX: 'auto', 
            paddingBottom: '24px',
            height: 'calc(100vh - 250px)', // Approx height
            alignItems: 'flex-start'
        }}>
            {COLUMNS.map(column => {
                const columnOrders = getOrdersByStatus(column.id);
                
                return (
                    <div 
                        key={column.id} 
                        style={{ 
                            minWidth: '320px', 
                            background: '#f8fafc', // Light gray background for column
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            maxHeight: '100%',
                            border: '1px solid #e2e8f0'
                        }}
                    >
                        {/* Column Header */}
                        <div style={{ 
                            padding: '16px', 
                            borderBottom: '1px solid #e2e8f0', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: 'white',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                    width: '10px', 
                                    height: '10px', 
                                    borderRadius: '50%', 
                                    backgroundColor: column.color 
                                }} />
                                <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{column.label}</span>
                            </div>
                            <span style={{ 
                                background: '#f1f5f9', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                fontSize: '12px', 
                                fontWeight: 500 
                            }}>
                                {columnOrders.length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div style={{ 
                            padding: '16px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px', 
                            overflowY: 'auto',
                            scrollbarWidth: 'thin'
                        }}>
                            {columnOrders.map(order => (
                                <div 
                                    key={order.id}
                                    onClick={() => onOrderClick(order.id)}
                                    style={{
                                        background: 'white',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        border: '1px solid #e2e8f0',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    className="hover:shadow-md hover:border-blue-300" // Tailwind utility usually works, or inline style logic needed
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ 
                                            fontFamily: 'monospace', 
                                            fontSize: '11px', 
                                            color: 'var(--admin-text-muted)',
                                            background: '#f1f5f9',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            #{order.id.slice(0, 8)}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text)' }}>
                                        {order.user?.name || 'Guest User'}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-primary)' }}>
                                            {formatCurrency(order.totalPrice)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {columnOrders.length === 0 && (
                                <div style={{ 
                                    textAlign: 'center', 
                                    padding: '20px', 
                                    color: 'var(--admin-text-muted)', 
                                    fontSize: '13px',
                                    border: '1px dashed #e2e8f0',
                                    borderRadius: '8px'
                                }}>
                                    No orders
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
