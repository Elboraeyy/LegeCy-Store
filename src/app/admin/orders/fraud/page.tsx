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
      <Suspense fallback={<div className="animate-pulse bg-gray-100 h-64 rounded-lg" />}>
        <FraudQueueClient initialReviews={pendingReviews} />
      </Suspense>
    </div>
  );
}
