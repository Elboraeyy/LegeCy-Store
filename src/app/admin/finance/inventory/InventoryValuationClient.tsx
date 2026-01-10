'use client';

import { formatCurrency } from '@/lib/utils';

interface ValuationItem {
  sku: string;
  productName: string;
  category: string;
  qty: number;
  costUnit: number;
  priceUnit: number;
  totalCost: number;
  totalRevenue: number;
}

interface ValuationSummary {
  totalAssetValue: number;
  totalPotentialRevenue: number;
  totalItems: number;
  potentialProfit: number;
}

interface ValuationData {
  summary: ValuationSummary;
  items: ValuationItem[];
}

export default function InventoryValuationClient({ data }: { data: ValuationData }) {
  const { summary, items } = data;

  const margin = summary.totalPotentialRevenue > 0 
    ? ((summary.potentialProfit / summary.totalPotentialRevenue) * 100).toFixed(1) 
    : '0';

  return (
    <>
      {/* Page Description */}
      <p className="page-description">
        Asset value vs potential revenue analysis
      </p>

      {/* Summary Cards */}
      <div className="admin-grid stats-grid">
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Asset Value</span>
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-value">{formatCurrency(summary.totalAssetValue)}</div>
          <div className="stat-hint">{summary.totalItems} items in stock</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Potential Revenue</span>
            <span className="stat-icon">💰</span>
          </div>
          <div className="stat-value positive">{formatCurrency(summary.totalPotentialRevenue)}</div>
          <div className="stat-hint">At current selling price</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Potential Profit</span>
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-value accent">{formatCurrency(summary.potentialProfit)}</div>
          <div className="stat-hint">Revenue - Cost</div>
        </div>
        
        <div className="admin-card stat-card">
          <div className="stat-header">
            <span className="stat-label">Avg. Margin</span>
            <span className="stat-icon">📊</span>
          </div>
          <div className="stat-value info">{margin}%</div>
          <div className="stat-hint">Profit Margin %</div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="admin-table-container">
        <div className="table-header">
          <h3>Inventory Breakdown</h3>
        </div>
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product / SKU</th>
                <th>Category</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Cost</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total Value</th>
                <th className="text-right">Potential Revenue</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: ValuationItem) => {
                const itemMargin = item.totalRevenue > 0 
                  ? ((item.totalRevenue - item.totalCost) / item.totalRevenue * 100).toFixed(0)
                  : 0;
                
                return (
                  <tr key={item.sku}>
                    <td>
                      <div className="product-name">{item.productName}</div>
                      <div className="product-sku">{item.sku}</div>
                    </td>
                    <td>
                      <span className="status-badge status-neutral">
                        {item.category}
                      </span>
                    </td>
                    <td className="text-right font-medium">{item.qty}</td>
                    <td className="text-right text-muted">{formatCurrency(item.costUnit)}</td>
                    <td className="text-right">{formatCurrency(item.priceUnit)}</td>
                    <td className="text-right font-bold">{formatCurrency(item.totalCost)}</td>
                    <td className="text-right">
                      <div className="revenue-value">{formatCurrency(item.totalRevenue)}</div>
                      <div className="margin-hint">{itemMargin}% margin</div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <span className="empty-icon">📦</span>
                    <span>No inventory items found</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>
          <span>ℹ️</span>
          About Inventory Valuation
        </h4>
        <p>
          This report shows the total value of your inventory at cost (asset value) and the potential 
          revenue if all items are sold at their current selling prices. Use this to understand your 
          stock investment and potential returns.
        </p>
      </div>

      <style jsx>{`
        .page-description {
          color: var(--admin-text-muted, #4A6B68);
          margin: 0 0 20px;
          font-size: 14px;
        }

        .stats-grid {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--admin-text-on-light, #12403C);
        }

        .stat-value.positive { color: #16a34a; }
        .stat-value.accent { color: #059669; }
        .stat-value.info { color: #0891b2; }

        .stat-hint {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .admin-table-container {
          margin-bottom: 24px;
        }

        .table-header {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(18, 64, 60, 0.08);
        }

        .table-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--admin-text-on-light, #12403C);
        }

        .table-scroll {
          overflow-x: auto;
        }

        .product-name {
          font-weight: 500;
        }

        .product-sku {
          font-family: monospace;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .status-neutral {
          background: rgba(107, 114, 128, 0.1);
          color: #4b5563;
          border: 1px solid rgba(107, 114, 128, 0.15);
        }

        .text-right {
          text-align: right;
        }

        .text-muted {
          color: var(--admin-text-muted, #4A6B68);
        }

        .font-medium {
          font-weight: 500;
        }

        .font-bold {
          font-weight: 700;
        }

        .revenue-value {
          font-weight: 700;
          color: #16a34a;
        }

        .margin-hint {
          font-size: 11px;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px !important;
          color: #9ca3af;
        }

        .empty-icon {
          display: block;
          font-size: 32px;
          margin-bottom: 8px;
        }

        .info-box {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: var(--admin-radius, 20px);
          padding: 16px 20px;
        }

        .info-box h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 8px;
          font-size: 14px;
          font-weight: 600;
          color: #1e40af;
        }

        .info-box p {
          margin: 0;
          font-size: 13px;
          color: #3b82f6;
          line-height: 1.5;
        }
      `}</style>
    </>
  );
}
