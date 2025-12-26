'use client';

import React from 'react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types/order';
import styles from './OrdersTable.module.css';
import { clsx } from 'clsx';

interface OrdersTableProps {
  orders: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onFilterChange: (key: string, value: string) => void;
  filters: {
    status?: string;
    sortBy?: string;
  };
}

export function OrdersTable({ orders, meta, onPageChange, onFilterChange, filters }: OrdersTableProps) {
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('status', e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange('sortBy', e.target.value);
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <select 
            className={styles.select} 
            value={filters.status || ''} 
            onChange={handleStatusChange}
          >
            <option value="">All Statuses</option>
            {Object.values(OrderStatus).map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
          </select>
          
          <select 
            className={styles.select} 
            value={filters.sortBy || 'newest'} 
            onChange={handleSortChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <div className={styles.pageInfo}>
          Total: {meta.total} orders
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Date</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Total</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className={styles.tr}>
                  <td className={`${styles.td} font-mono text-xs`}>
                    {order.id.slice(0,8)}...
                  </td>
                  <td className={styles.td}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.td}>
                    {/* Reusing existing badge or inline simple badge if I didn't verify Badge component styles recently */}
                     <span className={clsx(
                        styles.badge,
                        {
                          [styles.pending]: order.status === OrderStatus.Pending,
                          [styles.paid]: order.status === OrderStatus.Paid,
                          [styles.shipped]: order.status === OrderStatus.Shipped,
                          [styles.delivered]: order.status === OrderStatus.Delivered,
                          [styles.cancelled]: order.status === OrderStatus.Cancelled,
                        }
                     )}>
                      {order.status}
                     </span>
                  </td>
                  <td className={styles.td} style={{fontWeight: 600}}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalPrice)}
                  </td>
                  <td className={styles.td}>
                    <Link 
                      href={`/admin/orders/${order.id}`}
                      className={styles.viewLink}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <div className={styles.pageInfo}>
          Page {meta.page} of {meta.totalPages}
        </div>
        <div className={styles.pageButtons}>
          <button 
            className={styles.btn} 
            disabled={meta.page <= 1}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Previous
          </button>
          <button 
            className={styles.btn} 
            disabled={meta.page >= meta.totalPages}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
