'use client';

import { useState } from 'react';
import { completeFraudReview } from '@/lib/services/fraudService';
import { useRouter } from 'next/navigation';

interface FraudReview {
    id: string;
    orderId: string;
    score: number | { toNumber?: () => number };
    factors: unknown;
    reviewStatus: string;
    flagged: boolean;
    order: {
        id: string;
        totalPrice: { toNumber?: () => number } | number;
        customerName?: string | null;
        customerEmail?: string | null;
        customerPhone?: string | null;
        createdAt: Date;
        items: Array<{
            name: string;
            quantity: number;
            price: { toNumber?: () => number } | number;
        }>;
        user?: { email: string; name: string | null; id: string } | null;
    };
}

interface Props {
    initialReviews: FraudReview[];
}

export default function FraudQueueClient({ initialReviews }: Props) {
    const router = useRouter();
    const [reviews, setReviews] = useState(initialReviews);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleDecision = async (orderId: string, decision: 'APPROVED' | 'REJECTED', notes?: string) => {
        setProcessingId(orderId);
        try {
            await completeFraudReview(orderId, decision, 'admin', notes);
            setReviews(prev => prev.filter(r => r.orderId !== orderId));
            router.refresh();
        } catch (error) {
            console.error('Failed to process review:', error);
        }
        setProcessingId(null);
    };

    const getRiskColor = (score: number) => {
        if (score >= 70) return 'bg-red-100 text-red-700 border-red-300';
        if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-300';
        if (score >= 25) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-green-100 text-green-700 border-green-300';
    };

    const getPrice = (price: { toNumber?: () => number } | number): number => {
        if (typeof price === 'number') return price;
        if (price && typeof price.toNumber === 'function') return price.toNumber();
        return Number(price) || 0;
    };

    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-semibold text-gray-700">All Clear!</h3>
                <p className="text-gray-500 mt-2">No orders pending fraud review</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b">
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(Number(review.score))}`}>
                                Risk: {Number(review.score)}
                            </span>
                            <div>
                                <p className="font-medium">Order #{review.orderId.slice(0, 8)}</p>
                                <p className="text-sm text-gray-500">
                                    {review.order.customerName || 'Unknown'} • {review.order.customerEmail}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold">
                                {getPrice(review.order.totalPrice).toFixed(2)} EGP
                            </span>
                            <button
                                onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                {expandedId === review.id ? 'Less' : 'More'}
                            </button>
                        </div>
                    </div>

                    {/* Risk Factors */}
                    <div className="p-4 bg-gray-50">
                        <p className="text-sm font-medium text-gray-600 mb-2">Risk Factors:</p>
                        <div className="flex flex-wrap gap-2">
                            {(review.factors as Array<{ factor: string; score: number; details: string }>).map((f, i) => (
                                <span key={i} className="px-2 py-1 bg-white border rounded text-sm" title={f.details}>
                                    {f.factor} (+{f.score})
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === review.id && (
                        <div className="p-4 border-t">
                            <h4 className="font-medium mb-2">Order Items:</h4>
                            <ul className="space-y-1 text-sm">
                                {review.order.items.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{getPrice(item.price).toFixed(2)} EGP</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 text-sm text-gray-500">
                                <p>Phone: {review.order.customerPhone || 'N/A'}</p>
                                <p>Created: {new Date(review.order.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button
                            onClick={() => handleDecision(review.orderId, 'APPROVED')}
                            disabled={processingId === review.orderId}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {processingId === review.orderId ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                            onClick={() => {
                                const notes = prompt('Rejection reason (optional):');
                                handleDecision(review.orderId, 'REJECTED', notes || undefined);
                            }}
                            disabled={processingId === review.orderId}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            ✗ Reject & Cancel
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
