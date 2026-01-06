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
    
    const statusInfo: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
        pending: { emoji: '⏳', label: 'Pending', color: '#b76e00', bg: '#fff4e5' },
        payment_pending: { emoji: '💳', label: 'Awaiting Payment', color: '#f57c00', bg: '#fff8e1' },
        paid: { emoji: '✅', label: 'Paid', color: '#137333', bg: '#e6f4ea' },
        processing: { emoji: '📦', label: 'Processing', color: '#1565c0', bg: '#e3f2fd' },
        shipped: { emoji: '🚚', label: 'On the Way!', color: '#1967d2', bg: '#e8f0fe' },
        delivered: { emoji: '🎉', label: 'Delivered', color: '#0d652d', bg: '#ceead6' },
        cancelled: { emoji: '❌', label: 'Cancelled', color: '#c5221f', bg: '#fce8e6' },
        payment_failed: { emoji: '⚠️', label: 'Payment Failed', color: '#d32f2f', bg: '#ffebee' }
    };
    
    const status = statusInfo[order.status] || { emoji: '📋', label: order.status, color: '#3c4043', bg: '#f1f3f4' };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">{status.emoji}</div>
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        Order Confirmed!
                    </h1>
                    <p className="text-gray-600">
                        Thanks for shopping with us! Here&apos;s your order summary ✨
                    </p>
                </div>

                {/* Order Card */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    
                    {/* Status Banner */}
                    <div 
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ backgroundColor: status.bg }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{status.emoji}</span>
                            <div>
                                <p className="font-bold" style={{ color: status.color }}>{status.label}</p>
                                <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>

                    {/* Items Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            🛍️ Your Items
                        </h2>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center font-bold">
                                            {item.quantity}x
                                        </div>
                                        <p className="font-medium">{item.name}</p>
                                    </div>
                                    <p className="font-bold text-[var(--color-primary)]">
                                        EGP {Number(item.price).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="p-6 bg-gradient-to-r from-[var(--color-primary)] to-[#2d5a4e] text-white">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-white/80 text-sm">Total Amount</p>
                                <p className="text-3xl font-bold">EGP {Number(order.totalPrice).toLocaleString()}</p>
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            📍 Shipping Details
                        </h2>
                        <div className="bg-[var(--color-background)] rounded-2xl p-4 space-y-2">
                            {order.customerName && (
                                <p className="font-semibold">👤 {order.customerName}</p>
                            )}
                            {order.customerPhone && (
                                <p className="text-gray-600">📱 {order.customerPhone}</p>
                            )}
                            {order.customerEmail && (
                                <p className="text-gray-600">✉️ {order.customerEmail}</p>
                            )}
                            {order.shippingAddress && (
                                <p className="text-gray-600">
                                    🏠 {order.shippingAddress}
                                    {order.shippingCity && `, ${order.shippingCity}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            💳 Payment Method
                        </h2>
                        <div className="bg-[var(--color-background)] rounded-2xl p-4 flex items-center gap-3">
                            <span className="text-2xl">
                                {order.paymentMethod === 'cod' ? '💵' : 
                                 order.paymentMethod === 'paymob' ? '💳' : 
                                 order.paymentMethod === 'wallet' ? '📱' : '💰'}
                            </span>
                            <div>
                                <p className="font-semibold">
                                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                     order.paymentMethod === 'paymob' ? 'Online Payment (Card)' : 
                                     order.paymentMethod === 'wallet' ? 'Mobile Wallet' : 
                                     order.paymentMethod || 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {order.status === 'paid' || order.status === 'delivered' ? '✅ Payment completed' : 
                                     order.paymentMethod === 'cod' ? '💵 Pay when you receive your order' :
                                     '⏳ Awaiting payment'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6">
                        <div className="flex gap-3">
                            <Link 
                                href={`/track/${orderId}`}
                                className="flex-1 text-center py-4 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-2xl font-bold hover:bg-[var(--color-primary)] hover:text-white transition flex items-center justify-center gap-2"
                            >
                                🔍 Track Order
                            </Link>
                            <Link 
                                href="/shop"
                                className="flex-1 text-center py-4 bg-[var(--color-primary)] text-white rounded-2xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
                            >
                                🛒 Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Thank You Footer */}
                <div className="text-center mt-8">
                    <p className="text-2xl mb-2">🙏</p>
                    <p className="text-gray-600 font-medium">Thank you for choosing Legacy!</p>
                    <p className="text-gray-500 text-sm mt-1">We can&apos;t wait to get your order to you 💚</p>
                </div>
            </div>
        </div>
    );
}

