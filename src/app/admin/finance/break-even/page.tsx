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
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'EGP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusStyle = (status: 'profitable' | 'break-even' | 'loss') => {
    switch (status) {
      case 'profitable':
        return { bg: 'positive', icon: '✅', label: 'Profitable' };
      case 'break-even':
        return { bg: 'warning', icon: '⚖️', label: 'Break-Even' };
      case 'loss':
        return { bg: 'negative', icon: '📉', label: 'Loss' };
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
      </div>
    );
  }

  return (
    <>
      {/* Page Description */}
      <p className="page-description">
        Know how much you need to sell to cover costs
      </p>

      {/* Brand Level Break-Even */}
      {brandData && (
        <div className="admin-card section-card">
          <div className="section-header">
            <h3><span>🏢</span> Brand-Level Break-Even</h3>
            <span className={`status-tag ${getStatusStyle(brandData.status).bg}`}>
              {getStatusStyle(brandData.status).icon} {getStatusStyle(brandData.status).label}
            </span>
          </div>

          <div className="admin-grid stats-grid">
            <StatCard 
              label="Monthly Fixed Costs"
              value={formatCurrency(brandData.totalMonthlyFixedCosts)}
              icon="💸"
            />
            <StatCard 
              label="Avg. Profit Margin"
              value={formatCurrency(brandData.avgProfitMargin)}
              icon="📊"
            />
            <StatCard 
              label="Units to Break-Even"
              value={brandData.unitsToBreakEven.toLocaleString()}
              icon="🎯"
              highlight
            />
            <StatCard 
              label="Current Monthly Sales"
              value={`${brandData.currentMonthlySales.toLocaleString()} units`}
              icon="📦"
            />
          </div>

          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className={`progress-fill ${brandData.status}`}
                style={{ 
                  width: `${Math.min(100, (brandData.currentMonthlySales / brandData.unitsToBreakEven) * 100)}%` 
                }}
              />
            </div>
            <div className="progress-labels">
              <span>0</span>
              <span>Break-Even: {brandData.unitsToBreakEven.toLocaleString()}</span>
              <span className="progress-percent">
                {((brandData.currentMonthlySales / brandData.unitsToBreakEven) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Revenue Target */}
          <div className="info-box info">
            <p>
              <strong>Revenue needed for break-even:</strong> {formatCurrency(brandData.revenueToBreakEven)}
            </p>
          </div>
        </div>
      )}

      {/* Product Level Break-Even */}
      <div className="admin-card section-card">
        <div className="section-header">
          <h3><span>📦</span> Product-Level Break-Even</h3>
        </div>

        {/* Product Selector */}
        <div className="product-selector">
          <label>Select Product</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="form-input"
          >
            <option value="">-- Choose a product --</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>

        {productData ? (
          <div className="product-analysis">
            <div className="product-header">
              <h4>{productData.productName}</h4>
              <span className={`status-tag ${getStatusStyle(productData.status).bg}`}>
                {getStatusStyle(productData.status).icon} {getStatusStyle(productData.status).label}
              </span>
            </div>

            <div className="admin-grid stats-grid-sm">
              <StatCard label="Selling Price" value={formatCurrency(productData.unitPrice)} icon="💵" />
              <StatCard label="Unit Cost" value={formatCurrency(productData.unitCost)} icon="🏭" />
              <StatCard label="Profit Margin" value={formatCurrency(productData.profitMargin)} icon="📈" />
              <StatCard label="Margin %" value={`${productData.profitMarginPercent.toFixed(1)}%`} icon="📊" />
              <StatCard label="Units Needed" value={`${productData.unitsToBreakEven}`} icon="🎯" highlight />
              <StatCard label="Current Sales" value={`${productData.currentMonthlySales}`} icon="📦" />
            </div>

            {/* Product Progress */}
            <div className="progress-container sm">
              <div className="progress-bar small">
                <div 
                  className={`progress-fill ${productData.status}`}
                  style={{ 
                    width: `${Math.min(100, (productData.currentMonthlySales / productData.unitsToBreakEven) * 100)}%` 
                  }}
                />
              </div>
            </div>

            {/* Recommendation */}
            <div className={`info-box ${productData.status === 'profitable' ? 'success' : productData.status === 'loss' ? 'danger' : 'warning'}`}>
              {productData.status === 'profitable' ? (
                <p>
                  ✅ <strong>Excellent!</strong> This product is profitable. Sales exceed break-even by {productData.currentMonthlySales - productData.unitsToBreakEven} units.
                </p>
              ) : productData.status === 'loss' ? (
                <p>
                  ⚠️ <strong>Warning!</strong> This product is at a loss. Need to sell {productData.unitsToBreakEven - productData.currentMonthlySales} more units to break even.
                </p>
              ) : (
                <p>
                  ⚖️ <strong>Break-Even!</strong> This product is exactly at break-even. Any additional sales will generate profit.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state-container">
            <span className="empty-icon">📊</span>
            <p>Select a product to view break-even analysis</p>
          </div>
        )}
      </div>

      {/* Formula Explanation */}
      <div className="admin-card formula-card">
        <h3><span>📐</span> How is this calculated?</h3>
        <div className="formulas-grid">
          <div className="formula-item">
            <code>Break-Even Units = Fixed Costs ÷ Profit Margin per Unit</code>
            <p>The number of units you need to sell to cover all fixed costs</p>
          </div>
          <div className="formula-item">
            <code>Profit Margin = Selling Price - Unit Cost</code>
            <p>The profit you make on each unit sold</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .admin-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(18, 64, 60, 0.1);
          border-top-color: #12403C;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .page-description {
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 24px;
          font-size: 14px;
        }

        .section-card {
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .section-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .section-header h3 span {
          font-size: 24px;
        }

        .status-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 13px;
          font-weight: 500;
        }

        .status-tag.positive {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .status-tag.negative {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .status-tag.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-bottom: 20px;
        }

        .stats-grid-sm {
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          margin-bottom: 16px;
        }

        .progress-container {
          margin-bottom: 24px;
        }

        .progress-container.sm {
          margin-bottom: 16px;
        }

        .progress-bar {
          background: rgba(18, 64, 60, 0.1);
          border-radius: 99px;
          height: 16px;
          overflow: hidden;
        }

        .progress-bar.small {
          height: 12px;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.5s ease;
        }

        .progress-fill.profitable {
          background: #22c55e;
        }

        .progress-fill.break-even {
          background: #f59e0b;
        }

        .progress-fill.loss {
          background: #ef4444;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
          margin-top: 8px;
        }

        .progress-percent {
          color: #22c55e;
          font-weight: 500;
        }

        .info-box {
          padding: 16px;
          border-radius: 12px;
        }

        .info-box p {
          margin: 0;
        }

        .info-box.info {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
        }

        .info-box.success {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }

        .info-box.warning {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .info-box.danger {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .product-selector {
          margin-bottom: 24px;
        }

        .product-selector label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: var(--admin-text-muted, #4A6B68);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .product-selector .form-input {
          max-width: 400px;
        }

        .product-analysis {
          padding-top: 16px;
          border-top: 1px solid rgba(18, 64, 60, 0.08);
        }

        .product-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .product-header h4 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .empty-state-container {
          text-align: center;
          padding: 48px 24px;
          color: var(--admin-text-muted, #4A6B68);
        }

        .empty-icon {
          display: block;
          font-size: 48px;
          margin-bottom: 12px;
        }

        .formula-card {
          background: rgba(18, 64, 60, 0.03);
        }

        .formula-card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px;
          font-size: 16px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .formulas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
        }

        .formula-item code {
          display: block;
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(18, 64, 60, 0.08);
          font-family: monospace;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .formula-item p {
          margin: 0;
          font-size: 13px;
          color: var(--admin-text-muted, #4A6B68);
        }
      `}</style>
    </>
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
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      border: highlight ? 'none' : '1px solid rgba(18, 64, 60, 0.08)',
      background: highlight ? '#12403C' : 'rgba(18, 64, 60, 0.03)',
      color: highlight ? 'white' : 'inherit'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span>{icon}</span>
        <span style={{ fontSize: '11px', color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--admin-text-muted)' }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: highlight ? 'white' : 'var(--admin-text-on-light)' }}>{value}</p>
    </div>
  );
}
