'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminLogout } from '@/lib/actions/admin-auth';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';

// SVG Icons
const icons = {
    sales: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.91 8.84 8.56 2.23a1.93 1.93 0 0 0-1.81 0L3.1 4.13a2.12 2.12 0 0 0-.05 3.69l12.22 6.93a2 2 0 0 0 1.94 0L21 12.51a2.12 2.12 0 0 0-.09-3.67Z"/><path d="m3.09 8.84 12.35-6.61"/><path d="M20.91 8.84 8.56 2.23"/></svg>
    ),
    products: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    operations: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    ),
    finance: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
    ),
    management: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
    ),
    chevronDown: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    )
};

interface NavItem {
    label: string;
    href?: string;
    children?: NavItem[];
}

const navStructure: Record<string, { icon: keyof typeof icons; items: NavItem[] }> = {
    'Sales': {
        icon: 'sales',
        items: [
            { label: 'Orders', href: '/admin/orders' },
            { label: 'Order Risk', href: '/admin/orders/risk' },
            { label: 'Returns Intel', href: '/admin/orders/returns/intelligence' },
            { label: 'Customers', href: '/admin/customers' },
            { label: 'Reviews', href: '/admin/reviews' },
            { label: 'Coupons', href: '/admin/coupons' }
        ]
    },
    'Catalog': {
        icon: 'products', // Reusing products icon
        items: [
            { label: 'Products', href: '/admin/products' },
            { label: 'Categories', href: '/admin/categories' },
            { label: 'Brands', href: '/admin/brands' },
            { label: 'Materials', href: '/admin/materials' }
        ]
    },
    'Operations': {
        icon: 'operations',
        items: [
            { label: 'Inventory', href: '/admin/inventory' },
            { label: 'Procurement', href: '/admin/procurement' },
            { label: 'Supplier Perf.', href: '/admin/procurement/performance' },
            { label: 'Warehouses', href: '/admin/inventory/warehouses' },
            { label: 'Transfers', href: '/admin/inventory/transfers' },
        ]
    },
    'Finance': {
        icon: 'finance',
        items: [
            { label: 'Dashboard', href: '/admin/finance' },
            { 
                label: 'Treasury', 
                children: [
                    { label: 'Cash Forecast', href: '/admin/finance/forecast' },
                    { label: 'Break-Even', href: '/admin/finance/break-even' },
                    { label: 'Profit Quality', href: '/admin/finance/profit-quality' },
                ]
            },
            { 
                label: 'Accounting', 
                children: [
                    { label: 'Accounts', href: '/admin/finance/accounts' },
                    { label: 'Journal', href: '/admin/finance/transactions' },
                    { label: 'Expenses', href: '/admin/finance/expenses' },
                    { label: 'Inventory Value', href: '/admin/finance/inventory' },
                ]
            },
            { 
                label: 'Capital', 
                children: [
                    { label: 'Partners', href: '/admin/finance/partners' },
                    { label: 'Equity', href: '/admin/finance/equity' },
                    { label: 'Periods', href: '/admin/finance/periods' },
                ]
            },
            { 
                label: 'Reports', 
                children: [
                    { label: 'P&L', href: '/admin/finance/reports/pnl' },
                    { label: 'Balance Sheet', href: '/admin/finance/reports/balance' },
                    { label: 'Cash Flow', href: '/admin/finance/reports/cashflow' },
                    { label: 'Board Report', href: '/admin/finance/reports/board' },
                ]
            }
        ]
    },
    'Management': {
        icon: 'management',
        items: [
            { label: 'Daily Brief', href: '/admin/daily/ceo-brief' },
            { label: 'Team', href: '/admin/team' },
            { label: 'Decisions', href: '/admin/team/decisions' },
            { label: 'Roles', href: '/admin/team/roles' },
            { label: 'Approvals', href: '/admin/team/approvals' },
            { label: 'Activity', href: '/admin/activity' },
            { label: 'Audit Trail', href: '/admin/activity/audit-timeline' },
            { label: 'Kill Switches', href: '/admin/config/security/kill-switches' },
            { label: 'Settings', href: '/admin/config' }
        ]
    }
};

export function AdminSidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        'Sales': true,
        'Catalog': true,
        'Operations': true,
        'Finance': true,
        'Management': true
    });

    const getNavStructure = () => ({
        'Sales': {
            label: t.admin.sidebar.sales,
            icon: 'sales' as keyof typeof icons,
            items: [
                { label: t.admin.sidebar.orders, href: '/admin/orders' },
                { label: t.admin.sidebar.order_risk, href: '/admin/orders/risk' },
                { label: t.admin.sidebar.returns_intel, href: '/admin/orders/returns/intelligence' },
                { label: t.admin.sidebar.customers, href: '/admin/customers' },
                { label: t.admin.sidebar.reviews, href: '/admin/reviews' },
                { label: t.admin.sidebar.coupons, href: '/admin/coupons' }
            ]
        },
        'Catalog': {
            label: t.admin.sidebar.catalog,
            icon: 'products' as keyof typeof icons,
            items: [
                { label: t.admin.sidebar.products, href: '/admin/products' },
                { label: t.admin.sidebar.categories, href: '/admin/categories' },
                { label: t.admin.sidebar.brands, href: '/admin/brands' },
                { label: t.admin.sidebar.materials, href: '/admin/materials' }
            ]
        },
        'Operations': {
            label: t.admin.sidebar.operations,
            icon: 'operations' as keyof typeof icons,
            items: [
                { label: t.admin.sidebar.inventory, href: '/admin/inventory' },
                { label: t.admin.sidebar.procurement, href: '/admin/procurement' },
                { label: t.admin.sidebar.supplier_perf, href: '/admin/procurement/performance' },
                { label: t.admin.sidebar.warehouses, href: '/admin/inventory/warehouses' },
                { label: t.admin.sidebar.transfers, href: '/admin/inventory/transfers' },
            ]
        },
        'Finance': {
            label: t.admin.sidebar.finance,
            icon: 'finance' as keyof typeof icons,
            items: [
                { label: t.admin.sidebar.dashboard, href: '/admin/finance' },
                {
                    label: t.admin.sidebar.treasury,
                    children: [
                        { label: t.admin.sidebar.cash_forecast, href: '/admin/finance/forecast' },
                        { label: t.admin.sidebar.break_even, href: '/admin/finance/break-even' },
                        { label: t.admin.sidebar.profit_quality, href: '/admin/finance/profit-quality' },
                    ]
                },
                {
                    label: t.admin.sidebar.accounting,
                    children: [
                        { label: t.admin.sidebar.accounts, href: '/admin/finance/accounts' },
                        { label: t.admin.sidebar.journal, href: '/admin/finance/transactions' },
                        { label: t.admin.sidebar.expenses, href: '/admin/finance/expenses' },
                        { label: t.admin.sidebar.inventory_value, href: '/admin/finance/inventory' },
                    ]
                },
                {
                    label: t.admin.sidebar.capital,
                    children: [
                        { label: t.admin.sidebar.partners, href: '/admin/finance/partners' },
                        { label: t.admin.sidebar.equity, href: '/admin/finance/equity' },
                        { label: t.admin.sidebar.periods, href: '/admin/finance/periods' },
                    ]
                },
                {
                    label: t.admin.sidebar.reports,
                    children: [
                        { label: t.admin.sidebar.pnl, href: '/admin/finance/reports/pnl' },
                        { label: t.admin.sidebar.balance_sheet, href: '/admin/finance/reports/balance' },
                        { label: t.admin.sidebar.cash_flow, href: '/admin/finance/reports/cashflow' },
                        { label: t.admin.sidebar.board_report, href: '/admin/finance/reports/board' },
                    ]
                }
            ]
        },
        'Management': {
            label: t.admin.sidebar.management,
            icon: 'management' as keyof typeof icons,
            items: [
                { label: t.admin.sidebar.daily_brief, href: '/admin/daily/ceo-brief' },
                { label: t.admin.sidebar.team, href: '/admin/team' },
                { label: t.admin.sidebar.decisions, href: '/admin/team/decisions' },
                { label: t.admin.sidebar.roles, href: '/admin/team/roles' },
                { label: t.admin.sidebar.approvals, href: '/admin/team/approvals' },
                { label: t.admin.sidebar.activity, href: '/admin/activity' },
                { label: t.admin.sidebar.audit_trail, href: '/admin/activity/audit-timeline' },
                { label: t.admin.sidebar.kill_switches, href: '/admin/config/security/kill-switches' },
                { label: t.admin.sidebar.settings, href: '/admin/config' }
            ]
        }
    });

    const navStructure = getNavStructure();

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const isActive = (href?: string) => {
        if (!href) return false;
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    const renderNavItems = (items: NavItem[], depth = 0) => {
        return items.map((item) => {
            if (item.children) {
                return (
                    <div key={item.label} className="nav-group">
                        <div className="nav-group-label" style={{ paddingLeft: `${16 + depth * 12}px`, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px', marginBottom: '4px' }}>
                            {item.label}
                        </div>
                        {renderNavItems(item.children, depth + 1)}
                    </div>
                );
            }
            return (
                <Link
                    key={item.href}
                    href={item.href!}
                    className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
                    style={{ paddingLeft: `${16 + depth * 12}px` }}
                >
                    <span className="nav-dot" style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: isActive(item.href) ? 'var(--primary)' : 'var(--border-color)',
                        marginRight: '12px'
                    }}/>
                    <span>{item.label}</span>
                </Link>
            );
        });
    };

    return (
        <aside className="admin-sidebar" style={{ width: '260px', overflowY: 'auto' }}>
            <div className="admin-brand" style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="brand-icon">L</div>
                <div>
                    <span className="brand-text">Legacy</span>
                    <span className="brand-badge">Neural Admin</span>
                </div>
            </div>

            <nav className="admin-nav" style={{ padding: '16px 0' }}>
                {Object.entries(navStructure).map(([key, data]) => (
                    <div key={key} className="nav-section" style={{ marginBottom: '24px' }}>
                        <div 
                            className="section-header" 
                            onClick={() => toggleSection(key)}
                            style={{ 
                                padding: '8px 24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                fontWeight: 600
                            }}
                        >
                            <span className="section-icon" style={{ marginRight: '12px', width: '20px', height: '20px' }}>
                                {icons[data.icon]}
                            </span>
                            <span style={{ flex: 1 }}>{data.label}</span>
                            <span 
                                style={{ 
                                    width: '16px', 
                                    height: '16px', 
                                    transition: 'transform 0.2s',
                                    transform: expandedSections[key] ? 'rotate(0deg)' : 'rotate(-90deg)'
                                }}
                            >
                                {icons.chevronDown}
                            </span>
                        </div>
                        
                        {expandedSections[key] && (
                            <div className="section-items" style={{ marginTop: '4px' }}>
                                {renderNavItems(data.items)}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="admin-logout-wrapper" style={{ borderTop: '1px solid var(--border-color)', padding: '16px' }}>
                <form action={adminLogout}>
                    <button type="submit" className="admin-logout-btn" style={{ width: '100%', justifyContent: 'center' }}>
                        <span className="admin-nav-icon">{icons.logout}</span>
                        <span>{t.admin.sidebar.logout}</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
