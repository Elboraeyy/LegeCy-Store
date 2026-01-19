import { Suspense } from 'react';
import { getOrdersPendingFraudReview } from '@/lib/services/fraudService';
import FraudQueueClient from './FraudQueueClient';

export const metadata = {
  title: 'Fraud Review Queue | Admin',
  description: 'Review and approve/reject flagged orders'
};

export default async function FraudReviewPage() {
  const pendingReviews = await getOrdersPendingFraudReview();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fraud Review Queue</h1>
          <p className="text-gray-500 mt-1">
            Review and approve/reject orders flagged for potential fraud
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            {pendingReviews.length} Pending
          </span>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded-lg" />}>
        <FraudQueueClient initialReviews={pendingReviews} />
      </Suspense>
    </div>
  );
}
