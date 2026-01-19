'use client';

import '@/app/admin/admin.css';
import { useState, useEffect, useCallback } from 'react';
import { getDeadStockReport, DeadStockItem } from '@/lib/actions/inventory-analytics';
import { toast } from 'sonner';

export default function DeadStockPage() {
    const [report, setReport] = useState<DeadStockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(90);

    useEffect(() => {
        loadReport();
    }, [days]); // eslint-disable-line react-hooks/exhaustive-deps
    // Note: Leaving as is or wrapping? If I wrap loadReport, I need to add it to deps.
    // Ideally:

    const loadReport = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getDeadStockReport(days);
            setReport(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load dead stock report');
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const totalValue = report.reduce((sum, item) => sum + item.totalValue, 0);
    const totalItems = report.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="admin-page">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="admin-title">Stocks Analysis</h1>
                    <p className="admin-subtitle">Identify slow-moving inventory and potential losses</p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Threshold (Days):</label>
                    <select 
                        value={days} 
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#12403C]"
                    >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={180}>180 Days</option>
                        <option value={365}>1 Year</option>
                    </select>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="admin-card bg-red-50 border-red-100">
                    <p className="text-sm text-red-600 font-medium mb-1">Total Dead Stock Value</p>
                    <p className="text-2xl font-bold text-red-800">
                        {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                    </p>
                    <p className="text-xs text-red-500 mt-1">Capital tied up in inactive items</p>
                </div>
                <div className="admin-card bg-orange-50 border-orange-100">
                    <p className="text-sm text-orange-600 font-medium mb-1">Impacted Units</p>
                    <p className="text-2xl font-bold text-orange-800">{totalItems}</p>
                    <p className="text-xs text-orange-500 mt-1">Total quantity taking up space</p>
                </div>
                <div className="admin-card bg-blue-50 border-blue-100">
                    <p className="text-sm text-blue-600 font-medium mb-1">SKUs at Risk</p>
                    <p className="text-2xl font-bold text-blue-800">{report.length}</p>
                    <p className="text-xs text-blue-500 mt-1">Total variants affected</p>
                </div>
            </div>

            {/* Table */}
            <div className="admin-card overflow-hidden">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Slow Moving Items</h2>
                    <button onClick={loadReport} className="text-sm text-gray-500 hover:text-gray-800">
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading analysis...</div>
                ) : report.length === 0 ? (
                    <div className="p-12 text-center text-green-600 bg-green-50 rounded-lg">
                        <span className="text-4xl block mb-2">✅</span>
                        <p className="font-medium">Great news! No dead stock found.</p>
                        <p className="text-sm">Your inventory is moving healthily within the selected timeframe.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Product</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">SKU</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Quantity</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Unit Cost</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Total Value</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Days Inactive</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Last Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {report.map((item) => (
                                    <tr key={item.variantId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.productName}</div>
                                            <div className="text-gray-500 text-xs">{item.variantName}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-500">{item.sku}</td>
                                        <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {item.costPrice.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                                            {item.totalValue.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                item.daysInactive > 180 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {item.daysInactive} days
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {item.lastSold ? new Date(item.lastSold).toLocaleDateString() : 'Never Sold'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
