"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore, CART_CLEARED_FLAG } from '@/context/StoreContext';
import Link from 'next/link';
import { processPaymobCallback } from './actions';
import { useLanguage } from '@/context/LanguageContext';

type PageStatus = 'processing' | 'success' | 'failed';

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useStore();
    const { t, language } = useLanguage();
    
    const [status, setStatus] = useState<PageStatus>('processing');
    const [orderId, setOrderId] = useState<string | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(3);
    const processedRef = useRef(false);

    // Convert searchParams to object
    const paramsObject = useMemo(() => {
        const obj: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            obj[key] = value;
        });
        return obj;
    }, [searchParams]);

    // Check if payment looks successful from URL
    const urlIndicatesSuccess = useMemo(() => {
        return paramsObject.success === 'true' && 
               paramsObject.pending !== 'true' && 
               paramsObject.is_voided !== 'true';
    }, [paramsObject]);

    // Process payment on mount
    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        // Check if we already processed payment and reloaded
        const successOrderId = sessionStorage.getItem('payment_success_order');
        if (successOrderId) {
            console.log('Payment already processed - showing success UI');
            sessionStorage.removeItem('payment_success_order');
            // Use queueMicrotask to avoid synchronous setState within effect
            queueMicrotask(() => {
                setOrderId(successOrderId);
                setStatus('success');
            });
            return;
        }

        async function processPayment() {
            console.log('Processing payment callback...');
            console.log('URL indicates success:', urlIndicatesSuccess);
            
            const merchantOrderId = paramsObject.merchant_order_id;
            if (merchantOrderId) {
                setOrderId(merchantOrderId);
            }

            try {
                const result = await processPaymobCallback(paramsObject);
                console.log('Server action result:', result);

                const finalOrderId = result.orderId || merchantOrderId;

                if (result.orderStatus) {
                    setOrderStatus(result.orderStatus);
                }

                if (result.error) {
                    setErrorMessage(result.error);
                }

                // Determine success based on result OR URL params
                const isSuccess = result.success || 
                                  result.orderStatus === 'paid' || 
                                  urlIndicatesSuccess;

                if (isSuccess && finalOrderId) {
                    console.log('Payment successful - clearing cart and reloading');
                    // Set flags - one for cart clearing (consumed by StoreContext), one for success UI
                    sessionStorage.setItem(CART_CLEARED_FLAG, 'true');
                    sessionStorage.setItem('payment_success_order', finalOrderId);
                    // Clear localStorage directly
                    localStorage.removeItem('cart');
                    // Reload to refresh StoreContext with cleared cart
                    window.location.reload();
                    return;
                } else if (isSuccess) {
                    // Success but no orderId - just clear and show
                    sessionStorage.setItem(CART_CLEARED_FLAG, 'true');
                    clearCart();
                    setStatus('success');
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error('Payment processing error:', error);
                
                // Fallback: trust URL params if server action fails
                if (urlIndicatesSuccess) {
                    const merchantOrderId = paramsObject.merchant_order_id;
                    sessionStorage.setItem(CART_CLEARED_FLAG, 'true');
                    if (merchantOrderId) {
                        sessionStorage.setItem('payment_success_order', merchantOrderId);
                    }
                    localStorage.removeItem('cart');
                    window.location.reload();
                    return;
                } else {
                    setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
                    setStatus('failed');
                }
            }
        }

        processPayment();
    }, [paramsObject, urlIndicatesSuccess, clearCart]);

    // Auto redirect countdown for success
    useEffect(() => {
        if (status !== 'success' || !orderId) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(`/orders/${orderId}`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [status, orderId, router]);

    if (status === 'processing') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[var(--color-primary)] mx-auto mb-4"></div>
                    <p className="text-lg">{t.payment.processing}</p>
                    <p className="text-sm text-gray-500 mt-2">{t.payment.processing_desc}</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.payment.success_title}</h1>
                    <p className="text-gray-600 mb-4">
                        {t.payment.success_desc}
                    </p>
                    {orderId && (
                        <p className="text-sm text-gray-500 mb-2">
                            {t.payment.order_id}: <span className="font-mono font-bold">{orderId.slice(0, 8)}</span>
                        </p>
                    )}
                    {orderStatus && (
                        <p className="text-xs text-green-600 mb-4 uppercase">
                            {t.payment.status}: {orderStatus}
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mb-6">
                        {t.payment.redirecting.replace('{seconds}', String(countdown))}
                    </p>
                    <div className="space-y-3">
                        <Link 
                            href={orderId ? `/orders/${orderId}` : '/orders'}
                            className="block w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                        >
                            OK
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Failed status
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.payment.failed_title}</h1>
                <p className="text-gray-600 mb-4">
                    {t.payment.failed_desc}
                </p>
                {errorMessage && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                        <p className="text-sm text-red-600">{errorMessage}</p>
                    </div>
                )}
                {orderId && (
                    <p className="text-sm text-gray-500 mb-4">
                        {t.payment.order_id}: <span className="font-mono font-bold">{orderId.slice(0, 8)}</span>
                    </p>
                )}

                {/* Helpful tips */}
                <div className={`bg-gray-50 rounded-lg p-4 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{t.payment.common_reasons}:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                        <li>• {t.payment.reasons.insufficient_funds}</li>
                        <li>• {t.payment.reasons.bank_declined}</li>
                        <li>• {t.payment.reasons.internet_issue}</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <button 
                        onClick={() => router.push('/checkout')}
                        className="block w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition cursor-pointer"
                    >
                        {t.payment.try_again}
                    </button>

                    {/* WhatsApp Support */}
                    <a
                        href={`https://wa.me/201515205073?text=${encodeURIComponent(t.payment.whatsapp_message)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t.payment.whatsapp}
                    </a>

                    <Link 
                        href="/"
                        className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                        {t.payment.home}
                    </Link>
                </div>
            </div>
        </div>
    );
}
