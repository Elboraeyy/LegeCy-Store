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
    
    const statusColors: Record<string, { bg: string; text: string; label: string }> = {
        pending: { bg: '#fff4e5', text: '#b76e00', label: 'Pending' },
        payment_pending: { bg: '#fff8e1', text: '#f57c00', label: 'Awaiting Payment' },
        paid: { bg: '#e6f4ea', text: '#137333', label: 'Paid' },
        processing: { bg: '#e3f2fd', text: '#1565c0', label: 'Processing' },
        shipped: { bg: '#e8f0fe', text: '#1967d2', label: 'Shipped' },
        delivered: { bg: '#ceead6', text: '#0d652d', label: 'Delivered' },
        cancelled: { bg: '#fce8e6', text: '#c5221f', label: 'Cancelled' },
        payment_failed: { bg: '#ffebee', text: '#d32f2f', label: 'Payment Failed' }
    };
    
    const statusStyle = statusColors[order.status] || { bg: '#f1f3f4', text: '#3c4043', label: order.status };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const subtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return (
        <div className="min-h-screen bg-[var(--color-background)] py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Invoice Header */}
                <div className="bg-white rounded-t-2xl shadow-lg px-8 pt-8 pb-6 border-b-2 border-dashed border-gray-200">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-heading)' }}>
                                LEGACY
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Order Receipt</p>
                        </div>
                        <div 
                            className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                            {statusStyle.label}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-gray-500 mb-1">Order Number</p>
                            <p className="font-mono font-bold text-lg"># {order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 mb-1">Order Date</p>
                            <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                    </div>
                </div>
                
                {/* Order Items */}
                <div className="bg-white shadow-lg px-8 py-6">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Order Items</h2>
                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-12 h-12 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    {item.quantity}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-sm text-gray-500">Qty: {item.quantity} × EGP {(Number(item.price) / item.quantity).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">EGP {Number(item.price).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Totals */}
                <div className="bg-white shadow-lg px-8 py-6 border-t border-gray-100">
                    <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>EGP {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span className="text-green-600 font-medium">Free</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-[var(--color-primary)]">EGP {Number(order.totalPrice).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                {/* Customer & Shipping Info */}
                <div className="bg-white shadow-lg px-8 py-6 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Customer Details</h3>
                            <div className="space-y-2 text-gray-700">
                                {order.customerName && <p className="font-semibold">{order.customerName}</p>}
                                {order.customerEmail && (
                                    <p className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        {order.customerEmail}
                                    </p>
                                )}
                                {order.customerPhone && (
                                    <p className="flex items-center gap-2 text-sm">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {order.customerPhone}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {order.shippingAddress && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Shipping Address</h3>
                                <div className="text-gray-700">
                                    <p className="flex items-start gap-2 text-sm">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>
                                            {order.shippingAddress}
                                            {order.shippingCity && <>, {order.shippingCity}</>}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Payment Info */}
                <div className="bg-white shadow-lg px-8 py-6 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Payment Method</h3>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {order.paymentMethod === 'cod' ? (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">
                                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                 order.paymentMethod === 'paymob' ? 'Online Payment (Card)' : 
                                 order.paymentMethod === 'wallet' ? 'Mobile Wallet' : 
                                 order.paymentMethod || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {order.status === 'paid' ? 'Payment completed' : 
                                 order.status === 'pending' && order.paymentMethod === 'cod' ? 'Pay on delivery' :
                                 'Pending payment'}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Actions */}
                <div className="bg-white rounded-b-2xl shadow-lg px-8 py-6 border-t border-gray-100">
                    <div className="flex gap-4">
                        <Link 
                            href={`/track/${orderId}`}
                            className="flex-1 text-center py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                        >
                            Track Order
                        </Link>
                        <Link 
                            href="/shop"
                            className="flex-1 text-center py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
                
                {/* Footer Note */}
                <div className="text-center mt-6 text-sm text-gray-500">
                    <p>Thank you for shopping with Legacy!</p>
                    <p className="mt-1">If you have any questions, please contact our support.</p>
                </div>
            </div>
        </div>
    );
}
