'use client';

interface InventoryStatsProps {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalQuantity: number;
}

export default function InventoryStats({ totalItems, lowStockCount, outOfStockCount, totalQuantity }: InventoryStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-md">
                <h3 className="text-sm font-medium text-[var(--text-muted-dark)] uppercase tracking-wider">Total SKUs</h3>
                <div className="text-3xl font-bold mt-2 text-[var(--text-on-dark)]">{totalItems}</div>
            </div>

            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-md">
                <h3 className="text-sm font-medium text-[var(--text-muted-dark)] uppercase tracking-wider">Total Units</h3>
                <div className="text-3xl font-bold mt-2 text-[var(--text-on-dark)]">{totalQuantity.toLocaleString()}</div>
            </div>

            <div className="p-6 rounded-lg border border-yellow-900/30 bg-yellow-900/10 backdrop-blur-md">
                <h3 className="text-sm font-medium text-yellow-500 uppercase tracking-wider">Low Stock</h3>
                <div className="text-3xl font-bold mt-2 text-yellow-500">{lowStockCount}</div>
            </div>

            <div className="p-6 rounded-lg border border-red-900/30 bg-red-900/10 backdrop-blur-md">
                <h3 className="text-sm font-medium text-red-500 uppercase tracking-wider">Out of Stock</h3>
                <div className="text-3xl font-bold mt-2 text-red-500">{outOfStockCount}</div>
            </div>
        </div>
    );
}
