import prisma from '@/lib/prisma';

export const metadata = {
    title: 'Batch Expiry Warnings | Admin Inventory',
    description: 'Monitor inventory batches approaching expiration'
};

export default async function ExpiryWarningsPage() {
    const warningDate30 = new Date();
    warningDate30.setDate(warningDate30.getDate() + 30);

    const warningDate7 = new Date();
    warningDate7.setDate(warningDate7.getDate() + 7);

    const expiringBatches = await prisma.inventoryBatch.findMany({
        where: {
            expiryDate: { lte: warningDate30 },
            remainingQuantity: { gt: 0 }
        },
        include: {
            variant: {
                include: {
                    product: { select: { name: true } }
                }
            },
            stockIn: { select: { warehouse: { select: { name: true } } } }
        },
        orderBy: { expiryDate: 'asc' }
    });

    const urgentBatches = expiringBatches.filter(b => b.expiryDate && b.expiryDate <= warningDate7);
    const warningBatches = expiringBatches.filter(b => b.expiryDate && b.expiryDate > warningDate7);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Batch Expiry Warnings</h1>
                    <p className="text-gray-500 mt-1">
                        Inventory batches expiring within 30 days
                    </p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {urgentBatches.length} Critical (≤7 days)
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                        {warningBatches.length} Warning (8-30 days)
                    </span>
                </div>
            </div>

            {expiringBatches.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="text-lg font-medium text-green-700">No Expiring Batches</h3>
                    <p className="text-green-600">All inventory is fresh and within date</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Product</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Batch</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Warehouse</th>
                                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Qty</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Expiry Date</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Days Left</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {expiringBatches.map((batch) => {
                                const daysLeft = batch.expiryDate
                                    ? Math.ceil((batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                                    : 0;
                                const isUrgent = daysLeft <= 7;
                                const isExpired = daysLeft <= 0;

                                return (
                                    <tr key={batch.id} className={isExpired ? 'bg-red-50' : isUrgent ? 'bg-amber-50' : ''}>
                                        <td className="px-6 py-4">
                                            {isExpired ? (
                                                <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">EXPIRED</span>
                                            ) : isUrgent ? (
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">URGENT</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">WARNING</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium">{batch.variant.product.name}</td>
                                        <td className="px-6 py-4 font-mono text-sm">{batch.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4">{batch.stockIn?.warehouse?.name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-right font-mono">{batch.remainingQuantity}</td>
                                        <td className="px-6 py-4">
                                            {batch.expiryDate ? batch.expiryDate.toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${isExpired ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-600'}`}>
                                                {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
