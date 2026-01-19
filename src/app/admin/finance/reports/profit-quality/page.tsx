'use client';

import '@/app/admin/admin.css';
import { useState, useEffect } from 'react';
import { getProfitQualityReport } from '@/lib/actions/financial-reports';

export default function ProfitQualityPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfitQualityReport().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="admin-page p-8 text-center text-gray-500">Loading Report...</div>;

    return (
        <div className="admin-page">
            <h1 className="admin-title mb-2">Profit Quality Analysis</h1>
            <p className="admin-subtitle mb-8">Understanding the "Real" vs "Accounting" Profit</p>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Gross Profit</h3>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.grossProfit.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                    </div>
                    <div className="text-sm text-green-600 mt-1">
                        Margin: {data.grossMargin.toFixed(1)}%
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Operating Profit</h3>
                    <div className="text-2xl font-bold text-gray-900">
                        {data.operatingProfit.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Cash on Hand</h3>
                    <div className="text-2xl font-bold text-blue-600">
                        {data.cashBalance.toLocaleString('en-US', { style: 'currency', currency: 'EGP' })}
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Quality Ratio</h3>
                    <div className={`text-2xl font-bold ${data.cashBalance > data.operatingProfit ? 'text-green-600' : 'text-yellow-600'}`}>
                        {data.operatingProfit > 0 ? (data.cashBalance / data.operatingProfit).toFixed(2) : 'N/A'}x
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Cash Coverage of Profit</p>
                </div>
            </div>

            {/* Waterfall Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="h5 mb-6">Income Statement Waterfall</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">Total Revenue</span>
                        <span className="font-bold text-green-700">+{data.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3">
                        <span className="text-gray-600 pl-4">Cost of Goods Sold (COGS)</span>
                        <span className="font-medium text-red-600">-{data.cogs.toLocaleString()}</span>
                    </div>
                     <div className="border-t border-dashed my-2"></div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="font-medium">Gross Profit</span>
                        <span className="font-bold text-blue-800">{data.grossProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3">
                        <span className="text-gray-600 pl-4">Operating Expenses</span>
                        <span className="font-medium text-red-600">-{data.expenses.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-gray-200 my-2"></div>
                    <div className="flex justify-between items-center p-4 bg-gray-900 text-white rounded-lg shadow-lg transform scale-105">
                        <span className="font-bold text-lg">Net Operating Profit</span>
                        <span className="font-bold text-lg">{data.operatingProfit.toLocaleString()} EGP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
