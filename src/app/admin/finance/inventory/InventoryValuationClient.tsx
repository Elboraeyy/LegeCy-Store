
'use client';

import { formatCurrency } from '@/lib/utils'; // Uses standard utils for formatting

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

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Inventory Valuation</h1>
          <p className="admin-subtitle">Asset value vs Potential Revenue</p>
        </div>
      </div>

      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '40px' }}>
        <div className="admin-card">
          <div className="stat-label">Total Cost Value (Asset)</div>
          <div className="stat-value" style={{ color: '#0f172a' }}>{formatCurrency(summary.totalAssetValue)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{summary.totalItems} items in stock</div>
        </div>

        <div className="admin-card">
          <div className="stat-label">Potential Revenue</div>
          <div className="stat-value" style={{ color: '#166534' }}>{formatCurrency(summary.totalPotentialRevenue)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>At current selling price</div>
        </div>

        <div className="admin-card">
          <div className="stat-label">Potential Gross Profit</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>{formatCurrency(summary.potentialProfit)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Revenue - Cost</div>
        </div>

        <div className="admin-card">
          <div className="stat-label">Avg Margin</div>
          <div className="stat-value" style={{ color: '#0891b2' }}>
            {summary.totalPotentialRevenue > 0 
                ? ((summary.potentialProfit / summary.totalPotentialRevenue) * 100).toFixed(1) + '%' 
                : '0%'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Profit Margin %</div>
        </div>
      </div>

      <div className="admin-card">
        <h3 className="font-heading" style={{ fontSize: '18px', marginBottom: '20px' }}>Inventory Value Breakdown</h3>
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Product / SKU</th>
                        <th>Category</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Cost</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total Asset Value</th>
                        <th style={{ textAlign: 'right' }}>Potential Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item: ValuationItem) => (
                        <tr key={item.sku}>
                            <td>
                                <div style={{ fontWeight: 500 }}>{item.productName}</div>
                                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                    {item.sku}
                                </div>
                            </td>
                            <td>
                                <span style={{ 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    background: '#f3f4f6', 
                                    fontSize: '11px',
                                    border: '1px solid var(--admin-border)'
                                }}>
                                    {item.category}
                                </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>{item.qty}</td>
                            <td style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                                {formatCurrency(item.costUnit)}
                            </td>
                            <td style={{ textAlign: 'right', fontSize: '13px' }}>
                                {formatCurrency(item.priceUnit)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                {formatCurrency(item.totalCost)}
                            </td>
                            <td style={{ textAlign: 'right', color: '#166534' }}>
                                {formatCurrency(item.totalRevenue)}
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No inventory items found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
