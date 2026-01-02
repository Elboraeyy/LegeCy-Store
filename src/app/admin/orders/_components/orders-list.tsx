'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OrderStatus } from '@/lib/orderStatus';
import { Order } from '@/types/order';

interface OrdersListProps {
    orders: Order[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    search?: string;
    status?: OrderStatus;
}

export function OrdersList({ orders, meta, search, status }: OrdersListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) params.set('search', term);
        else params.delete('search');
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handleStatusFilter = (s: string) => {
        const params = new URLSearchParams(searchParams);
        if (s) params.set('status', s);
        else params.delete('status');
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search ID..." 
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        defaultValue={search}
                        onBlur={(e) => handleSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e.currentTarget.value)}
                    />
                    <select 
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={status || ''}
                        onChange={(e) => handleStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        {Object.values(OrderStatus).map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-lg shadow overflow-hidden" style={{ backgroundColor: 'var(--card-bg)' }}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200" style={{ backgroundColor: 'var(--card-bg)' }}>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                                                {order.id.slice(0, 8)}...
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ${order.totalPrice.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {order.items?.length || 0} items
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/admin/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg" style={{ backgroundColor: 'var(--card-bg)' }}>
                    <div className="text-sm text-gray-700">
                        Page <span className="font-medium">{meta.page}</span> of <span className="font-medium">{meta.totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            disabled={meta.page <= 1}
                            onClick={() => handlePageChange(meta.page - 1)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button 
                            disabled={meta.page >= meta.totalPages}
                            onClick={() => handlePageChange(meta.page + 1)}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        [OrderStatus.Pending]: 'bg-yellow-100 text-yellow-800',
        [OrderStatus.Paid]: 'bg-green-100 text-green-800',
        [OrderStatus.Shipped]: 'bg-blue-100 text-blue-800',
        [OrderStatus.Delivered]: 'bg-purple-100 text-purple-800',
        [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
}
