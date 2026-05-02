'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { 
    getInventoryValuation, 
    getStockMovementReport, 
    getLowStockReport, 
    getWarehouseComparison, 
    getActivitySummary,
    InventoryValuation,
    StockMovementSummary,
    LowStockItem,
    WarehouseComparison
} from '@/lib/actions/inventory-reports';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

const formatCurrency = (amount: number, locale: string = 'en-EG') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EGP',
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function ReportsPage() {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const { hasPermission, isLoading: permLoading } = useAdminPermissions();
    const [loading, setLoading] = useState(true);
    const [valuation, setValuation] = useState<InventoryValuation | null>(null);
    const [movements, setMovements] = useState<StockMovementSummary[]>([]);
    const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
    const [comparison, setComparison] = useState<WarehouseComparison[]>([]);
    const [activity, setActivity] = useState({ recentAdjustments: 0, pendingTransfers: 0, activeAlerts: 0, activeCounts: 0 });

    const loadReports = useCallback(async () => {
        const [val, mov, low, comp, act] = await Promise.all([
            getInventoryValuation(),
            getStockMovementReport(7),
            getLowStockReport(),
            getWarehouseComparison(),
            getActivitySummary()
        ]);
        setValuation(val);
        setMovements(mov);
        setLowStock(low);
        setComparison(comp);
        setActivity(act);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!permLoading && hasPermission('INVENTORY_MANAGE')) {
            const timer = setTimeout(() => {
                void loadReports();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [permLoading, hasPermission, loadReports]);


    if (permLoading) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.inventory.reports.loading}</div>;
    if (!hasPermission('INVENTORY_MANAGE')) return <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#991b1b' }}>{t.inventory.access_denied}</div>;

    const locale = language === 'ar' ? 'ar-EG' : 'en-EG';

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.inventory.reports.title}</h1>
                    <p className="admin-subtitle">{t.inventory.reports.subtitle}</p>
                </div>
                <button 
                    onClick={() => { setLoading(true); loadReports(); }}
                    className="admin-btn admin-btn-primary"
                    disabled={loading}
                >
                    {loading ? t.inventory.reports.loading : `↻ ${t.inventory.reports.refresh}`}
                </button>
            </div>

            {/* Breadcrumb */}
            <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--admin-text-muted)' }}>
                <Link href="/admin/inventory" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none' }}>{t.inventory.title}</Link>
                <span style={{ margin: '0 8px' }}>/</span>
                <span style={{ color: 'var(--admin-text-on-light)' }}>{t.inventory.reports.title}</span>
            </div>

            {loading ? (
                <div className="admin-table-container" style={{ padding: '60px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                    {t.inventory.reports.loading}
                </div>
            ) : (
                <>
                    {/* Quick Activity Stats */}
                    <div className="admin-grid" style={{ marginBottom: '32px' }}>
                        <div className="admin-card">
                                <div className="stat-label">{t.inventory.reports.stats.recent_adjustments}</div>
                            <div className="stat-value">{activity.recentAdjustments}</div>
                        </div>
                        <div className="admin-card">
                                <div className="stat-label">{t.inventory.reports.stats.pending_transfers}</div>
                            <div className="stat-value" style={{ color: activity.pendingTransfers > 0 ? '#b76e00' : 'inherit' }}>
                                {activity.pendingTransfers}
                            </div>
                        </div>
                        <div className="admin-card">
                                <div className="stat-label">{t.inventory.reports.stats.active_alerts}</div>
                            <div className="stat-value" style={{ color: activity.activeAlerts > 0 ? '#991b1b' : 'inherit' }}>
                                {activity.activeAlerts}
                            </div>
                        </div>
                        <div className="admin-card">
                                <div className="stat-label">{t.inventory.reports.stats.active_counts}</div>
                            <div className="stat-value">{activity.activeCounts}</div>
                        </div>
                    </div>

                    {/* Inventory Valuation */}
                    {valuation && (
                        <div className="admin-card" style={{ marginBottom: '32px' }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', marginBottom: '24px' }}>
                                    📊 {t.inventory.reports.valuation.title}
                            </h2>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--admin-surface-light)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>
                                        {valuation.totalSKUs}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {t.inventory.reports.valuation.total_skus}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--admin-surface-light)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>
                                        {valuation.totalUnits.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {t.inventory.reports.valuation.total_units}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--admin-surface-light)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#166534' }}>
                                            {formatCurrency(valuation.totalValue, locale)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {t.inventory.reports.valuation.total_value}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', padding: '20px', background: 'var(--admin-surface-light)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-text-on-light)' }}>
                                            {formatCurrency(valuation.averageValue, locale)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {t.inventory.reports.valuation.avg_value}
                                    </div>
                                </div>
                            </div>

                            {/* Value by Warehouse */}
                            {valuation.byWarehouse.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: '12px' }}>
                                            {t.inventory.reports.valuation.by_warehouse}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {valuation.byWarehouse.map(wh => {
                                            const percentage = valuation.totalValue > 0 ? (wh.value / valuation.totalValue) * 100 : 0;
                                            return (
                                                <div key={wh.warehouseId} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '120px', fontWeight: 500 }}>{wh.warehouseName}</div>
                                                    <div style={{ flex: 1, height: '24px', background: 'var(--admin-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ 
                                                            width: `${percentage}%`, 
                                                            height: '100%', 
                                                            background: 'linear-gradient(90deg, #1a3c34, #2d5a4a)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            paddingLeft: '8px',
                                                            color: '#fff',
                                                            fontSize: '11px',
                                                            fontWeight: 600
                                                        }}>
                                                            {percentage > 10 ? `${percentage.toFixed(1)}%` : ''}
                                                        </div>
                                                    </div>
                                                    <div style={{ width: '120px', textAlign: 'right', fontSize: '13px' }}>
                                                        {formatCurrency(wh.value, locale)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Low Stock Items */}
                        <div className="admin-card">
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ⚠️ {t.inventory.reports.low_stock.title}
                                {lowStock.length > 0 && (
                                    <span style={{ fontSize: '12px', background: '#991b1b', color: '#fff', padding: '2px 8px', borderRadius: '99px' }}>
                                        {lowStock.length}
                                    </span>
                                )}
                            </h2>
                            
                            {lowStock.length > 0 ? (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {lowStock.slice(0, 10).map(item => (
                                        <div key={`${item.variantId}-${item.warehouseId}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 0',
                                            borderBottom: '1px solid var(--admin-border)'
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.productName}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                                    {item.sku} • {item.warehouseName}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontWeight: 700, 
                                                    color: item.available === 0 ? '#991b1b' : '#b76e00' 
                                                }}>
                                                    {item.available} / {item.minStock}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            ✅ {t.inventory.reports.low_stock.all_good}
                                </div>
                            )}
                        </div>

                        {/* Warehouse Comparison */}
                        <div className="admin-card">
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '16px' }}>
                                    🏭 {t.inventory.reports.warehouse_health.title}
                            </h2>
                            
                            {comparison.length > 0 ? (
                                <div>
                                    {comparison.map(wh => (
                                        <div key={wh.warehouseId} style={{
                                            padding: '12px 0',
                                            borderBottom: '1px solid var(--admin-border)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 600 }}>{wh.warehouseName}</span>
                                                <span style={{ 
                                                    padding: '2px 10px', 
                                                    borderRadius: '99px', 
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: wh.utilizationScore >= 80 ? 'rgba(22, 101, 52, 0.1)' : 
                                                               wh.utilizationScore >= 50 ? 'rgba(183, 110, 0, 0.1)' : 'rgba(153, 27, 27, 0.1)',
                                                    color: wh.utilizationScore >= 80 ? '#166534' : 
                                                           wh.utilizationScore >= 50 ? '#b76e00' : '#991b1b'
                                                }}>
                                                    {t.inventory.reports.warehouse_health.healthy.replace('{score}', wh.utilizationScore.toString())}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                                <span>{t.inventory.reports.warehouse_health.stats_skus.replace('{count}', wh.totalSKUs.toString())}</span>
                                                <span>{t.inventory.reports.warehouse_health.stats_units.replace('{count}', wh.totalUnits.toLocaleString())}</span>
                                                {wh.lowStockCount > 0 && <span style={{ color: '#b76e00' }}>{t.inventory.reports.warehouse_health.stats_low.replace('{count}', wh.lowStockCount.toString())}</span>}
                                                {wh.outOfStockCount > 0 && <span style={{ color: '#991b1b' }}>{t.inventory.reports.warehouse_health.stats_out.replace('{count}', wh.outOfStockCount.toString())}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                            {t.inventory.reports.warehouse_health.no_data}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stock Movement (Last 7 Days) */}
                    <div className="admin-card">
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '16px' }}>
                                📈 {t.inventory.reports.movements.title}
                        </h2>
                        
                        {movements.length > 0 ? (
                            <div className="admin-table-container" style={{ background: 'transparent', boxShadow: 'none' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                                <th>{t.inventory.reports.movements.table.date}</th>
                                                <th style={{ textAlign: 'center' }}>{t.inventory.reports.movements.table.adjustments}</th>
                                                <th style={{ textAlign: 'center' }}>{t.inventory.reports.movements.table.transfers_in}</th>
                                                <th style={{ textAlign: 'center' }}>{t.inventory.reports.movements.table.transfers_out}</th>
                                                <th style={{ textAlign: 'center' }}>{t.inventory.reports.movements.table.orders}</th>
                                                <th style={{ textAlign: 'center' }}>{t.inventory.reports.movements.table.returns}</th>
                                                <th style={{ textAlign: 'right' }}>{t.inventory.reports.movements.table.net_change}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.map(day => (
                                            <tr key={day.period}>
                                                <td style={{ fontWeight: 500 }}>{new Date(day.period).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                                                <td style={{ textAlign: 'center' }}>{day.adjustments !== 0 ? (day.adjustments > 0 ? '+' : '') + day.adjustments : '-'}</td>
                                                <td style={{ textAlign: 'center', color: day.transfersIn > 0 ? '#166534' : 'inherit' }}>{day.transfersIn > 0 ? '+' + day.transfersIn : '-'}</td>
                                                <td style={{ textAlign: 'center', color: day.transfersOut > 0 ? '#991b1b' : 'inherit' }}>{day.transfersOut > 0 ? '-' + day.transfersOut : '-'}</td>
                                                <td style={{ textAlign: 'center', color: day.orderFulfillments > 0 ? '#991b1b' : 'inherit' }}>{day.orderFulfillments > 0 ? '-' + day.orderFulfillments : '-'}</td>
                                                <td style={{ textAlign: 'center', color: day.returns > 0 ? '#166534' : 'inherit' }}>{day.returns > 0 ? '+' + day.returns : '-'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: 700, color: day.netChange > 0 ? '#166534' : day.netChange < 0 ? '#991b1b' : 'inherit' }}>
                                                    {day.netChange > 0 ? '+' : ''}{day.netChange}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                        {t.inventory.reports.movements.no_data}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
