import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

interface Props {
    params: Promise<{ orderId: string }>;
}

export default async function OrderTrackingPage({ params }: Props) {
    const { orderId } = await params;
    
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true
        }
    });
    
    if (!order) {
        notFound();
    }
    
    const statusColors: Record<string, { bg: string; text: string }> = {
        pending: { bg: '#fff4e5', text: '#b76e00' },
        payment_pending: { bg: '#fff8e1', text: '#f57c00' },
        paid: { bg: '#e6f4ea', text: '#137333' },
        shipped: { bg: '#e8f0fe', text: '#1967d2' },
        delivered: { bg: '#ceead6', text: '#0d652d' },
        cancelled: { bg: '#fce8e6', text: '#c5221f' },
        payment_failed: { bg: '#ffebee', text: '#d32f2f' }
    };
    
    const statusStyle = statusColors[order.status] || { bg: '#f1f3f4', text: '#3c4043' };

    return (
        <div className="min-h-screen bg-[var(--color-background)] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Details</h1>
                        <p className="text-gray-500">Track your order status</p>
                    </div>
                    
                    {/* Order ID & Status */}
                    <div className="flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="text-sm text-gray-500">Order ID</p>
                            <p className="font-mono font-bold">{order.id.slice(0, 8)}</p>
                        </div>
                        <div 
                            className="px-4 py-2 rounded-full text-sm font-semibold uppercase"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                            {order.status.replace('_', ' ')}
                        </div>
                    </div>
                    
                    {/* Order Items */}
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">Items</h2>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">EGP {Number(item.price).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Totals */}
                    <div className="border-t pt-4 mb-6">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>EGP {Number(order.totalPrice).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    {/* Shipping Info */}
                    {order.shippingAddress && (
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
                            <p className="text-gray-600">
                                {order.shippingAddress}, {order.shippingCity}
                            </p>
                        </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex gap-4">
                        <Link 
                            href="/account/orders"
                            className="flex-1 text-center py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
                        >
                            All Orders
                        </Link>
                        <Link 
                            href="/"
                            className="flex-1 text-center py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
