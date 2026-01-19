'use client';

import { useEffect, useState } from 'react';
import { DollarSign, AlertTriangle, Package, RefreshCw } from 'lucide-react';

interface VariantData {
  id: string;
  sku: string;
  productName: string;
  productActive: boolean;
  price: number;
  costPrice: number | null;
  totalStock: number;
  createdAt: string;
}

interface ReportData {
  total: number;
  activeProducts: number;
  inactiveProducts: number;
  variants: VariantData[];
}

export default function MissingCostsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/inventory/missing-costs');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const filteredVariants = data?.variants.filter(v => {
    if (filter === 'active') return v.productActive;
    if (filter === 'inactive') return !v.productActive;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Missing Cost Prices</h1>
          <p className="text-gray-600">Variants without cost prices - COGS will be incomplete</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">COGS Tracking Incomplete</h3>
            <p className="text-sm text-amber-700">
              Variants without cost prices will result in inaccurate gross profit calculations.
              Please update the cost price for each variant to ensure accurate financial reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-gray-900">{data.total}</div>
            <div className="text-sm text-gray-600">Total Missing</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{data.activeProducts}</div>
            <div className="text-sm text-gray-600">Active Products</div>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="text-3xl font-bold text-gray-400">{data.inactiveProducts}</div>
            <div className="text-sm text-gray-600">Inactive Products</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['active', 'inactive', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f} ({f === 'all' ? data?.total : f === 'active' ? data?.activeProducts : data?.inactiveProducts})
          </button>
        ))}
      </div>

      {/* Variants Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredVariants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No variants with missing costs found
                </td>
              </tr>
            ) : (
              filteredVariants.map((variant) => (
                <tr key={variant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-sm">{variant.sku}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{variant.productName}</div>
                  </td>
                  <td className="px-6 py-4 text-right">{formatCurrency(variant.price)}</td>
                  <td className="px-6 py-4 text-right">{variant.totalStock}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      variant.productActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {variant.productActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a
                      href={`/admin/products?edit=${variant.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Edit
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
