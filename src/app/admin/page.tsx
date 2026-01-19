import AdminHomeClient from './_components/home/AdminHomeClient';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import prisma from '@/lib/prisma';
import { getKillSwitches } from '@/lib/killSwitches';
import Link from 'next/link';
import CustomerRiskWidget from './_components/dashboard/CustomerRiskWidget';
import BatchExpiryWidget from './_components/dashboard/BatchExpiryWidget';
import SystemHealthWidget from './_components/dashboard/SystemHealthWidget';

// Fetch command center stats
async function getCommandCenterStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Defensive: Check for missing models
        if (!prisma.order || !prisma.stockAlert) return {
            pendingOrders: 0,
            activeAlerts: 0,
            lowStockCount: 0,
            todayRevenue: 0,
            systemStatus: 'nominal' as const
        };

        const [pendingOrders, activeAlerts, lowStockItems, todayOrders] = await Promise.all([
            // Pending orders count
            prisma.order.count({
                where: {
                    status: { in: ['PENDING', 'PROCESSING'] }
                }
            }),
            // Active alerts count
            prisma.stockAlert.count({
                where: { status: 'ACTIVE' }
            }),
            // Low stock count - Robust handling for raw query or missing view
            prisma.$queryRaw<[{count: bigint}]>`
                SELECT COUNT(*) as count FROM "Inventory" 
                WHERE available < "minStock" AND "minStock" > 0
            `.then(r => Number(r[0]?.count || 0))
             .catch(e => {
                 console.warn('Low stock query failed, trying fallback view or returning 0', e);
                 // Try WarehouseStock view as fallback
                 return prisma.$queryRaw<[{count: bigint}]>`
                    SELECT COUNT(*) as count FROM "WarehouseStock" 
                    WHERE available < min_stock AND min_stock > 0
                 `.then(r => Number(r[0]?.count || 0)).catch(() => 0);
             }),
            // Today's revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: today },
                    // Fix: Exclude PENDING (abandoned) and other invalid statuses
                    status: { notIn: ['CANCELLED', 'PENDING', 'REJECTED', 'FAILED'] }
                },
                _sum: { totalPrice: true }
            })
        ]);

        // Determine system status
        let systemStatus: 'nominal' | 'attention' | 'critical' = 'nominal';
        if (activeAlerts > 5 || pendingOrders > 20) systemStatus = 'critical';
        else if (activeAlerts > 0 || pendingOrders > 10) systemStatus = 'attention';

        return {
            pendingOrders,
            activeAlerts,
            lowStockCount: lowStockItems,
            todayRevenue: todayOrders._sum?.totalPrice?.toNumber() || 0,
            systemStatus
        };
    } catch (error) {
        console.error('Failed to fetch command center stats:', error);
        return {
            pendingOrders: 0,
            activeAlerts: 0,
            lowStockCount: 0,
            todayRevenue: 0,
            systemStatus: 'attention' as const // Warn user something is wrong
        };
    }
}

// Fetch executive stats - INTELLIGENT DASHBOARD
async function getExecutiveStats() {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Defensive check for stale client
        if (!prisma.order || !prisma.expense || !prisma.inventory || !prisma.revenueRecognition) {
            console.warn('[AdminDashboard] Prisma client stale or missing models');
             return {
                cashOnHand: 0,
                monthlyExpenses: 0,
                monthlyRevenue: 0,
                inventoryValue: 0,
                netProfit: 0,
                profitMargin: 0,
                pendingApprovals: 0,
                disabledSwitches: 0,
                killSwitchesOK: true,
                warnings: ['⚠️ System restarting - please refresh'],
                hasWarnings: true
            };
        }

        const [
            killSwitches,
            treasuryAccounts,
            monthlyExpenses,
            monthlyRevenue,
            inventoryValue,
            recognizedRevenue
        ] = await Promise.all([
            getKillSwitches(),
            prisma.treasuryAccount.findMany(),
            prisma.expense.aggregate({
                where: { date: { gte: monthStart }, status: 'APPROVED' },
                _sum: { amount: true }
            }),
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: monthStart },
                    status: { in: ['Paid', 'Shipped', 'Delivered'] }
                },
                _sum: { totalPrice: true }
            }),
            // Inventory value from inventory with cost prices
            prisma.inventory.findMany({
                include: { variant: true }
            }),
            // Recognized revenue from ledger
            prisma.revenueRecognition.aggregate({
                where: { recognizedAt: { gte: monthStart } },
                _sum: { netRevenue: true, cogsAmount: true, grossProfit: true }
            })
        ]);
        
        const cashOnHand = treasuryAccounts.reduce((sum: number, acc: { balance: unknown }) => sum + Number(acc.balance), 0);
        
        // Calculate inventory value at cost
        const inventoryTotal = inventoryValue.reduce((sum: number, inv: { variant: { costPrice: unknown } | null; available: number }) => {
            const cost = Number(inv.variant?.costPrice || 0);
            return sum + (cost * inv.available);
        }, 0);
        
        // Calculate net profit from ledger
        const revenue = Number(monthlyRevenue._sum?.totalPrice || 0);
        const expenses = Number(monthlyExpenses._sum?.amount || 0);
        const cogs = Number(recognizedRevenue._sum?.cogsAmount || 0);
        const netProfit = revenue - expenses - cogs;
        const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        
        // Count disabled critical switches
        const disabledSwitches = Object.entries(killSwitches).filter(([key, val]) => {
            const critical = ['checkout_enabled', 'payments_enabled', 'paymob_enabled'];
            return critical.includes(key) && !val;
        }).length;
        
        // Generate warnings
        const warnings: string[] = [];
        if (netProfit < 0) warnings.push('⚠️ Negative profit this month');
        if (cashOnHand < expenses) warnings.push('💸 Cash below monthly expenses');
        if (disabledSwitches > 0) warnings.push('🔴 Critical systems disabled');
        
        return {
            cashOnHand,
            monthlyExpenses: expenses,
            monthlyRevenue: revenue,
            inventoryValue: inventoryTotal,
            netProfit,
            profitMargin,
            pendingApprovals: 0,
            disabledSwitches,
            killSwitchesOK: disabledSwitches === 0,
            warnings,
            hasWarnings: warnings.length > 0
        };
    } catch (error) {
        console.error('Failed to fetch executive stats:', error);
        return {
            cashOnHand: 0,
            monthlyExpenses: 0,
            monthlyRevenue: 0,
            inventoryValue: 0,
            netProfit: 0,
            profitMargin: 0,
            pendingApprovals: 0,
            disabledSwitches: 0,
            killSwitchesOK: true,
            warnings: ['⚠️ Error loading data'],
            hasWarnings: true
        };
    }
}

export default async function AdminDashboard() {
    await requireAdminPermission(AdminPermissions.DASHBOARD.VIEW);

    const [stats, execStats] = await Promise.all([
        getCommandCenterStats(),
        getExecutiveStats()
    ]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', { 
            style: 'currency', 
            currency: 'EGP',
            minimumFractionDigits: 0 
        }).format(amount);
    };

    return (
        <>
            <AdminHomeClient stats={stats} />
            
            {/* Executive Widgets */}
            <div style={{ padding: '0 32px 32px', marginTop: '-16px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                    📊 Executive Overview
                </h2>
                
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '16px' 
                }}>
                    {/* Cash Position */}
                    <Link href="/admin/finance/equity" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cash on Hand</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
                                        {formatCurrency(execStats.cashOnHand)}
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>💰</span>
                            </div>
                        </div>
                    </Link>

                    {/* Monthly Revenue */}
                    <Link href="/admin/finance/reports/pnl" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monthly Revenue</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px' }}>
                                        {formatCurrency(execStats.monthlyRevenue)}
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>📈</span>
                            </div>
                        </div>
                    </Link>

                    {/* Monthly Expenses */}
                    <Link href="/admin/finance/expenses" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Monthly Expenses</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>
                                        {formatCurrency(execStats.monthlyExpenses)}
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>💸</span>
                            </div>
                        </div>
                    </Link>

                    {/* Kill Switches Status */}
                    <Link href="/admin/config/security" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ 
                            padding: '20px',
                            border: !execStats.killSwitchesOK ? '2px solid #ef4444' : undefined
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>System Health</div>
                                    <div style={{ 
                                        fontSize: '18px', 
                                        fontWeight: 700, 
                                        color: execStats.killSwitchesOK ? '#22c55e' : '#ef4444',
                                        marginTop: '4px' 
                                    }}>
                                        {execStats.killSwitchesOK ? '✓ All Systems GO' : `⚠ ${execStats.disabledSwitches} Disabled`}
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>{execStats.killSwitchesOK ? '💚' : '🔴'}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Net Profit */}
                    <Link href="/admin/finance/reports/pnl" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ 
                            padding: '20px',
                            border: execStats.netProfit < 0 ? '2px solid #ef4444' : '2px solid #22c55e'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Net Profit (Month)</div>
                                    <div style={{ 
                                        fontSize: '24px', 
                                        fontWeight: 700, 
                                        color: execStats.netProfit >= 0 ? '#22c55e' : '#ef4444',
                                        marginTop: '4px' 
                                    }}>
                                        {formatCurrency(execStats.netProfit)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        {execStats.profitMargin.toFixed(1)}% margin
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>{execStats.netProfit >= 0 ? '📊' : '📉'}</span>
                            </div>
                        </div>
                    </Link>

                    {/* Inventory Value */}
                    <Link href="/admin/inventory" className="exec-widget" style={{ textDecoration: 'none' }}>
                        <div className="admin-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Inventory Value</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
                                        {formatCurrency(execStats.inventoryValue)}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                        at cost
                                    </div>
                                </div>
                                <span style={{ fontSize: '28px' }}>📦</span>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Warnings Section */}
                {execStats.hasWarnings && (
                    <div className="admin-card" style={{ 
                        marginTop: '16px', 
                        padding: '16px', 
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <span style={{ fontWeight: 600, color: '#ef4444' }}>Attention Required</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {execStats.warnings.map((warning, i) => (
                                <div key={i} style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                                    borderRadius: '8px',
                                    fontSize: '14px'
                                }}>
                                    {warning}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Operational Insights - New Widgets */}
            <div style={{ padding: '0 32px 32px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
                    🔍 Operational Insights
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '16px'
                }}>
                    <SystemHealthWidget />
                    <BatchExpiryWidget />
                    <CustomerRiskWidget />
                </div>
            </div>
        </>
    );
}
