"use client";

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

type PaymentStatus = 'loading' | 'success' | 'failed';

interface PaymentResult {
    status: PaymentStatus;
    orderId: string | null;
}

function usePaymentResult(): PaymentResult {
    const searchParams = useSearchParams();
    
    return useMemo(() => {
        const success = searchParams.get('success');
        const merchantOrderId = searchParams.get('merchant_order_id');
        
        console.log('Payment Callback Params:', { success, merchantOrderId });

        if (success === 'true' && merchantOrderId) {
            return { status: 'success', orderId: merchantOrderId };
        } else {
            return { status: 'failed', orderId: merchantOrderId };
        }
    }, [searchParams]);
}

export default function PaymentCallbackPage() {
    const router = useRouter();
    const { clearCart } = useStore();
    const { status, orderId } = usePaymentResult();
    const [countdown, setCountdown] = useState(3);
    const [cartCleared, setCartCleared] = useState(false);

    // Clear cart once on success
    useEffect(() => {
        if (status === 'success' && !cartCleared) {
            clearCart();
            setCartCleared(true);
        }
    }, [status, cartCleared, clearCart]);

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
                        Thank you for your order. Your payment has been received and your order is being processed.
                    </p>
                    {orderId && (
                        <p className="text-sm text-gray-500 mb-4">
                            Order ID: <span className="font-mono font-bold">{orderId.slice(0, 8)}</span>
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
                <p className="text-gray-600 mb-6">
                    Your payment could not be processed. Please try again or choose a different payment method.
                </p>
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
