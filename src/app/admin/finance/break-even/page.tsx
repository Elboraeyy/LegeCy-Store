'use client';

import { useEffect, useState } from 'react';
import { getProductBreakEven, getBrandBreakEven, BreakEvenResult, BrandBreakEvenResult } from '@/lib/services/cashFlowService';

type ProductOption = {
  id: string;
  name: string;
};

export default function BreakEvenPage() {
  const [brandData, setBrandData] = useState<BrandBreakEvenResult | null>(null);
  const [productData, setProductData] = useState<BreakEvenResult | null>(null);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      setLoading(true);
      try {
        const brand = await getBrandBreakEven();
        if (!cancelled) setBrandData(brand);
        
        const res = await fetch('/api/admin/products?status=active&limit=100');
        const data = await res.json();
        if (!cancelled) setProducts(data.products?.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })) || []);
      } catch (error) {
        console.error('Failed to load break-even data:', error);
      }
      if (!cancelled) setLoading(false);
    })();
    
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    
    let cancelled = false;
    
    (async () => {
      try {
        const data = await getProductBreakEven(selectedProduct);
        if (!cancelled) setProductData(data);
      } catch (error) {
        console.error('Failed to load product break-even:', error);
      }
    })();
    
    return () => { cancelled = true; };
  }, [selectedProduct]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusStyle = (status: 'profitable' | 'break-even' | 'loss') => {
    switch (status) {
      case 'profitable':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'رابح' };
      case 'break-even':
        return { bg: 'bg-amber-100', text: 'text-amber-800', icon: '⚖️', label: 'التعادل' };
      case 'loss':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: '📉', label: 'خسارة' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3c34]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a3c34]">حاسبة نقطة التعادل</h1>
        <p className="text-gray-500">Break-Even Calculator - اعرف كم تحتاج تبيع علشان تكسب</p>
      </div>

      {/* Brand Level Break-Even */}
      {brandData && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-[#1a3c34] flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              التعادل على مستوى البراند
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(brandData.status).bg} ${getStatusStyle(brandData.status).text}`}>
              {getStatusStyle(brandData.status).icon} {getStatusStyle(brandData.status).label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              label="المصروفات الثابتة الشهرية"
              value={formatCurrency(brandData.totalMonthlyFixedCosts)}
              icon="💸"
            />
            <StatCard 
              label="متوسط هامش الربح"
              value={formatCurrency(brandData.avgProfitMargin)}
              icon="📊"
            />
            <StatCard 
              label="القطع المطلوب بيعها"
              value={brandData.unitsToBreakEven.toLocaleString('ar-EG')}
              icon="🎯"
              highlight
            />
            <StatCard 
              label="المبيعات الحالية"
              value={`${brandData.currentMonthlySales.toLocaleString('ar-EG')} قطعة`}
              icon="📦"
            />
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                brandData.status === 'profitable' ? 'bg-green-500' :
                brandData.status === 'break-even' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, (brandData.currentMonthlySales / brandData.unitsToBreakEven) * 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>0</span>
            <span>نقطة التعادل: {brandData.unitsToBreakEven.toLocaleString('ar-EG')}</span>
            <span className="text-green-600 font-medium">
              {((brandData.currentMonthlySales / brandData.unitsToBreakEven) * 100).toFixed(0)}%
            </span>
          </div>

          {/* Revenue Target */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>الإيراد المطلوب للتعادل:</strong> {formatCurrency(brandData.revenueToBreakEven)}
            </p>
          </div>
        </div>
      )}

      {/* Product Level Break-Even */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#1a3c34] flex items-center gap-2 mb-6">
          <span className="text-2xl">📦</span>
          التعادل على مستوى المنتج
        </h2>

        {/* Product Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">اختر منتج</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3c34] focus:border-transparent"
          >
            <option value="">-- اختر منتج --</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>

        {productData ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">{productData.productName}</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(productData.status).bg} ${getStatusStyle(productData.status).text}`}>
                {getStatusStyle(productData.status).icon} {getStatusStyle(productData.status).label}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="سعر البيع" value={formatCurrency(productData.unitPrice)} icon="💵" />
              <StatCard label="التكلفة" value={formatCurrency(productData.unitCost)} icon="🏭" />
              <StatCard label="هامش الربح" value={formatCurrency(productData.profitMargin)} icon="📈" />
              <StatCard label="نسبة الهامش" value={`${productData.profitMarginPercent.toFixed(1)}%`} icon="📊" />
              <StatCard label="المطلوب بيعه" value={`${productData.unitsToBreakEven} قطعة`} icon="🎯" highlight />
              <StatCard label="المبيعات الحالية" value={`${productData.currentMonthlySales} قطعة`} icon="📦" />
            </div>

            {/* Product Progress */}
            <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  productData.status === 'profitable' ? 'bg-green-500' :
                  productData.status === 'break-even' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: `${Math.min(100, (productData.currentMonthlySales / productData.unitsToBreakEven) * 100)}%` 
                }}
              />
            </div>

            {/* Recommendation */}
            <div className={`p-4 rounded-lg ${
              productData.status === 'profitable' ? 'bg-green-50' :
              productData.status === 'loss' ? 'bg-red-50' : 'bg-amber-50'
            }`}>
              {productData.status === 'profitable' ? (
                <p className="text-green-800">
                  ✅ <strong>ممتاز!</strong> هذا المنتج يحقق أرباح. المبيعات تتجاوز نقطة التعادل بـ {productData.currentMonthlySales - productData.unitsToBreakEven} قطعة.
                </p>
              ) : productData.status === 'loss' ? (
                <p className="text-red-800">
                  ⚠️ <strong>تحذير!</strong> هذا المنتج يحقق خسارة. تحتاج بيع {productData.unitsToBreakEven - productData.currentMonthlySales} قطعة إضافية للوصول للتعادل.
                </p>
              ) : (
                <p className="text-amber-800">
                  ⚖️ <strong>التعادل!</strong> هذا المنتج يحقق التعادل بالضبط. أي مبيعات إضافية ستحقق أرباح.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl">📊</span>
            <p className="mt-2">اختر منتج لعرض تحليل التعادل</p>
          </div>
        )}
      </div>

      {/* Formula Explanation */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <span>📐</span>
          كيف يتم الحساب؟
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600" style={{ direction: 'ltr' }}>
          <div>
            <p className="font-mono bg-white p-3 rounded border mb-2">
              Break-Even Units = Fixed Costs ÷ Profit Margin
            </p>
            <p className="text-right" style={{ direction: 'rtl' }}>
              عدد القطع المطلوب = المصروفات الثابتة ÷ هامش الربح للقطعة
            </p>
          </div>
          <div>
            <p className="font-mono bg-white p-3 rounded border mb-2">
              Profit Margin = Selling Price - Unit Cost
            </p>
            <p className="text-right" style={{ direction: 'rtl' }}>
              هامش الربح = سعر البيع - تكلفة القطعة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon,
  highlight = false
}: { 
  label: string; 
  value: string; 
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-[#1a3c34] text-white border-[#1a3c34]' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className={`text-xs ${highlight ? 'text-gray-200' : 'text-gray-500'}`}>{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-white' : 'text-[#1a3c34]'}`}>{value}</p>
    </div>
  );
}
