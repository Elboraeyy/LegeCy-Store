'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface OrderPageProps {
    order: {
        id: string;
        orderNumber: number | null;
        status: string;
        createdAt: string;
        totalPrice: number;
        shippingCost: number;
        customerName: string | null;
        customerPhone: string | null;
        customerEmail: string | null;
        shippingAddress: string | null;
        shippingGovernorate: string | null;
        shippingCity: string | null;
        paymentMethod: string | null;
        items: Array<{
            id: string;
            name: string;
            quantity: number;
            price: number;
        }>;
    };
    orderId: string;
}

export default function OrderPageClient({ order, orderId }: OrderPageProps) {
    const { t, language } = useLanguage();

    const statusInfo: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
        pending: { emoji: '⏳', label: t.orders.status.pending, color: '#b76e00', bg: '#fff4e5' },
        payment_pending: { emoji: '💳', label: t.orders.status.payment_pending, color: '#f57c00', bg: '#fff8e1' },
        paid: { emoji: '✅', label: t.orders.status.paid, color: '#137333', bg: '#e6f4ea' },
        processing: { emoji: '📦', label: t.orders.status.processing, color: '#1565c0', bg: '#e3f2fd' },
        shipped: { emoji: '🚚', label: t.orders.status.shipped, color: '#1967d2', bg: '#e8f0fe' },
        delivered: { emoji: '🎉', label: t.orders.status.delivered, color: '#0d652d', bg: '#ceead6' },
        cancelled: { emoji: '❌', label: t.orders.status.cancelled, color: '#c5221f', bg: '#fce8e6' },
        payment_failed: { emoji: '⚠️', label: t.orders.status.payment_failed, color: '#d32f2f', bg: '#ffebee' }
    };
    
    const status = statusInfo[order.status] || { emoji: '📋', label: order.status, color: '#3c4043', bg: '#f1f3f4' };

    const formatDate = (dateStr: string) => {
        return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(dateStr));
    };

    const handleDownloadInvoice = () => {
        window.print();
    };

    const getPaymentLabel = () => {
        if (order.paymentMethod === 'cod') return t.orders.tracking.payment_info.cod;
        if (order.paymentMethod === 'wallet') return t.orders.tracking.payment_info.wallet;
        return order.paymentMethod || 'N/A';
    };

    const getPaymentStatusText = () => {
        if (order.status === 'paid' || order.status === 'delivered') return `✅ ${t.orders.tracking.payment_info.paid}`;
        if (order.paymentMethod === 'cod') return `💵 ${t.orders.tracking.payment_info.pay_on_delivery}`;
        return `⏳ ${t.orders.status.payment_pending}`;
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] py-12 px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="max-w-2xl mx-auto">
                
                {/* Success Header */}
                <div className="text-center mb-8 print:hidden">
                    <div className="text-6xl mb-4">{status.emoji}</div>
                    <h1 className="text-3xl font-bold text-[var(--color-primary)] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                        {t.orders.details.success_title}
                    </h1>
                    <p className="text-gray-600">
                        {t.orders.details.success_desc} ✨
                    </p>
                </div>

                {/* Order Card */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden" id="invoice-content">
                    
                    {/* Status Banner */}
                    <div 
                        className="px-6 py-4 flex items-center justify-between"
                        style={{ backgroundColor: status.bg }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{status.emoji}</span>
                            <div>
                                <p className="font-bold" style={{ color: status.color }}>{status.label}</p>
                                <p className="text-sm text-gray-600">#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>

                    {/* Items Section */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            🛍️ {t.orders.details.items}
                        </h2>
                        <div className="space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-[var(--color-background)] rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[var(--color-primary)] text-[var(--color-secondary)] rounded-xl flex items-center justify-center font-bold">
                                            {item.quantity}x
                                        </div>
                                        <p className="font-medium text-gray-800">{item.name}</p>
                                    </div>
                                    <p className="font-bold text-[var(--color-primary)]">
                                        EGP {Number(item.price).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Shipping Cost Line Item */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center px-4">
                            <span className="text-gray-600">{t.orders.details.shipping}</span>
                            <span className="font-bold">
                                {order.shippingCost === 0
                                    ? <span className="text-green-600">{t.orders.details.free}</span>
                                    : `EGP ${Number(order.shippingCost).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}`}
                            </span>
                        </div>
                    </div>

                    {/* Total Section */}
                    <div className="p-6 bg-[var(--color-primary)]">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[var(--color-secondary)] opacity-80 text-sm">{t.orders.details.summary.total}</p>
                                <p className="text-3xl font-bold text-[var(--color-secondary)]">
                                    EGP {Number(order.totalPrice).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                </p>
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            📍 {t.orders.details.shipping}
                        </h2>
                        <div className="bg-[var(--color-background)] rounded-2xl p-4 space-y-2">
                            {order.customerName && (
                                <p className="font-semibold text-gray-800">👤 {order.customerName}</p>
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
                                    {order.shippingGovernorate && `, ${order.shippingGovernorate}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            💳 {t.orders.details.payment}
                        </h2>
                        <div className="bg-[var(--color-background)] rounded-2xl p-4 flex items-center gap-3">
                            <span className="text-2xl">
                                {order.paymentMethod === 'cod' ? '💵' : 
                                 order.paymentMethod === 'wallet' ? '📱' : '💰'}
                            </span>
                            <div>
                                <p className="font-semibold text-gray-800">
                                    {getPaymentLabel()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {getPaymentStatusText()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Confirmation for Manual Payments */}
                    {(order.paymentMethod === 'wallet' || order.paymentMethod === 'instapay') && (
                        <div className="p-6 border-b border-gray-100 bg-[#e6fffa]">
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-[#059669]">
                                📱 {language === 'ar' ? 'تأكيد التحويل' : 'Confirm Transfer'}
                            </h2>
                            <p className="text-sm text-gray-700 mb-4">
                                {language === 'ar'
                                    ? 'لتسريع مراجعة طلبك، يرجى إرسال تفاصيل التحويل (صورة أو نص) عبر واتساب.'
                                    : 'To speed up verification, please send your transfer details (screenshot or text) via WhatsApp.'}
                            </p>
                            <a
                                href={`https://wa.me/201515205073?text=${encodeURIComponent(
                                    language === 'ar'
                                        ? `مرحباً، قمت بعمل طلب رقم #${order.id.slice(0, 8)} عن طريق ${order.paymentMethod === 'instapay' ? 'إنستا باي' : 'المحفظة'}. هذه تفاصيل التحويل:`
                                        : `Hello, I placed order #${order.id.slice(0, 8)} via ${order.paymentMethod === 'instapay' ? 'InstaPay' : 'Wallet'}. Here are my transfer details:`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-center py-4 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#128C7E] transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                {language === 'ar' ? 'إرسال التأكيد عبر واتساب' : 'Send Confirmation via WhatsApp'}
                            </a>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-6 print:hidden">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <Link 
                                    href={`/track/${orderId}`}
                                    className="flex-1 text-center py-4 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-2xl font-bold hover:bg-[var(--color-primary)] hover:text-[var(--color-secondary)] transition flex items-center justify-center gap-2"
                                >
                                    🔍 {t.orders.details.actions.track}
                                </Link>
                                <Link 
                                    href="/shop"
                                    className="flex-1 text-center py-4 bg-[var(--color-primary)] text-[var(--color-secondary)] rounded-2xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
                                >
                                    🛒 {t.orders.details.actions.continue}
                                </Link>
                            </div>
                            <button 
                                onClick={handleDownloadInvoice}
                                className="w-full text-center py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
                            >
                                📄 {t.orders.details.actions.download}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Thank You Footer */}
                <div className="text-center mt-8 print:hidden">
                    <p className="text-2xl mb-2">🙏</p>
                    <p className="text-gray-600 font-medium">{t.orders.details.invoice_footer.thank_you}</p>
                    <p className="text-gray-500 text-sm mt-1">{t.orders.details.invoice_footer.cant_wait} 💚</p>
                </div>
            </div>
        </div>
    );
}
