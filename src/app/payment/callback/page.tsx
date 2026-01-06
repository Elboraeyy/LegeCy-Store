"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';
import { processPaymobCallback } from './actions';

type PageStatus = 'processing' | 'success' | 'failed';

export default function PaymentCallbackPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { clearCart } = useStore();
    
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

                if (result.orderId) {
                    setOrderId(result.orderId);
                }

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

                if (isSuccess) {
                    console.log('Payment successful - clearing cart');
                    // Clear cart with slight delay to ensure state is updated
                    setTimeout(() => {
                        clearCart();
                        console.log('Cart cleared');
                    }, 100);
                    setStatus('success');
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error('Payment processing error:', error);
                
                // Fallback: trust URL params if server action fails
                if (urlIndicatesSuccess) {
                    clearCart();
                    setStatus('success');
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
                    <p className="text-lg">Processing your payment...</p>
                    <p className="text-sm text-gray-500 mt-2">Please wait, do not close this page</p>
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
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h1>
                    <p className="text-gray-600 mb-4">
                        Thank you for your order. Your payment has been received.
                    </p>
                    {orderId && (
                        <p className="text-sm text-gray-500 mb-2">
                            Order ID: <span className="font-mono font-bold">{orderId.slice(0, 8)}</span>
                        </p>
                    )}
                    {orderStatus && (
                        <p className="text-xs text-green-600 mb-4 uppercase">
                            Status: {orderStatus}
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mb-6">
                        Redirecting to your order in {countdown} seconds...
                    </p>
                    <div className="space-y-3">
                        <Link 
                            href={orderId ? `/orders/${orderId}` : '/orders'}
                            className="block w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition"
                        >
                            Track My Order
                        </Link>
                        <Link 
                            href="/"
                            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                        >
                            Continue Shopping
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
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h1>
                <p className="text-gray-600 mb-4">
                    Your payment could not be processed. Please try again.
                </p>
                {errorMessage && (
                    <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
                )}
                {orderId && (
                    <p className="text-sm text-gray-500 mb-4">
                        Order ID: <span className="font-mono">{orderId.slice(0, 8)}</span>
                    </p>
                )}
                <div className="space-y-3">
                    <button 
                        onClick={() => router.push('/checkout')}
                        className="block w-full bg-[var(--color-primary)] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition cursor-pointer"
                    >
                        Try Again
                    </button>
                    <Link 
                        href="/"
                        className="block w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>
        </div>
    );
}
