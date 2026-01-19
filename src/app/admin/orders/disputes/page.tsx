import prisma from '@/lib/prisma';
import DisputesClient from './DisputesClient';

export const metadata = {
  title: 'Dispute Management | Admin',
  description: 'Manage order disputes and chargebacks'
};

export default async function DisputesPage() {
  // Get orders with disputed status or cancelled with notes mentioning chargeback
  const disputes = await prisma.order.findMany({
    where: {
      OR: [
        { status: 'disputed' },
        { status: 'cancelled' }
      ]
    },
    include: {
      items: true,
      returnRequest: true,
      paymentIntent: true,
      notes: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  // Filter disputes that have chargeback notes
  const disputedOrders = disputes.filter(order =>
    order.status === 'disputed' ||
    order.notes?.some(n => n.content?.toLowerCase().includes('chargeback'))
  );

  // Get recent chargebacks from audit log
  const recentChargebacks = await prisma.auditLog.findMany({
    where: {
      action: { contains: 'CHARGEBACK' }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispute Management</h1>
          <p className="text-gray-500 mt-1">
            Handle disputed orders and chargebacks
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            {disputedOrders.length} Active Disputes
          </span>
        </div>
      </div>

      <DisputesClient disputes={disputedOrders} chargebacks={recentChargebacks} />
    </div>
  );
}
