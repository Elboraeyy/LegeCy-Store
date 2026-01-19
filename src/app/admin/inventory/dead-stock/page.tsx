import prisma from '@/lib/prisma';

export const metadata = {
    title: 'Dead Stock Report | Admin Inventory',
    description: 'Identify slow-moving and dead stock items'
};

export default async function DeadStockPage() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get inventory with no sales in last 90 days
    const allInventory = await prisma.inventory.findMany({
        where: {
            available: { gt: 0 }
        },
        include: {
            variant: {
                include: {
                    product: { select: { name: true, id: true } }
                }
            },
            warehouse: { select: { name: true } }
        }
    });

    // Get variant IDs that have had sales in last 90 days
    const recentSales = await prisma.orderItem.findMany({
        where: {
            order: {
                status: 'delivered',
                createdAt: { gte: ninetyDaysAgo }
            },
            variantId: { not: null }
        },
        select: { variantId: true },
        distinct: ['variantId']
    });

    const soldVariantIds = new Set(recentSales.map(s => s.variantId));

    // Filter to dead stock (no sales in 90 days)
    const deadStock = allInventory.filter(inv => !soldVariantIds.has(inv.variantId));

    // Calculate total value of dead stock
    const totalDeadValue = deadStock.reduce((sum, inv) => {
        const value = Number(inv.variant.price || 0) * inv.available;
        return sum + value;
    }, 0);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Dead Stock Report</h1>
                    <p className="text-gray-500 mt-1">
                        Items with no sales in the last 90 days
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Dead Stock Value</p>
                    <p className="text-2xl font-bold text-red-600">{totalDeadValue.toFixed(2)} EGP</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600">Dead Stock Items</p>
                    <p className="text-2xl font-bold text-red-700">{deadStock.length}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-amber-600">Total Units</p>
                    <p className="text-2xl font-bold text-amber-700">
                        {deadStock.reduce((sum, inv) => sum + inv.available, 0)}
                    </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600">% of Total Inventory</p>
                    <p className="text-2xl font-bold text-blue-700">
                        {allInventory.length > 0
                            ? ((deadStock.length / allInventory.length) * 100).toFixed(1)
                            : 0}%
                    </p>
                </div>
            </div>

            {deadStock.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="text-lg font-medium text-green-700">No Dead Stock!</h3>
                    <p className="text-green-600">All inventory items have had sales in the last 90 days</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Product</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Warehouse</th>
                                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Available</th>
                                <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Value</th>
                                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Days Since Sale</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {deadStock.map((inv) => {
                                const value = Number(inv.variant.price || 0) * inv.available;
                                return (
                                    <tr key={inv.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{inv.variant.product.name}</p>
                                            <p className="text-sm text-gray-500">SKU: {inv.variant.sku}</p>
                                        </td>
                                        <td className="px-6 py-4">{inv.warehouse.name}</td>
                                        <td className="px-6 py-4 text-right font-mono">{inv.available}</td>
                                        <td className="px-6 py-4 text-right font-mono">{value.toFixed(2)} EGP</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
                                                90+ days
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
