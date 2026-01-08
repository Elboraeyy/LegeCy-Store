
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const financeLinks = [
    { href: '/admin/finance', label: 'Dashboard', icon: '📊' },
    { href: '/admin/finance/equity', label: 'Capital & Partners', icon: '🤝' },
    { href: '/admin/finance/expenses', label: 'Expenses', icon: '💸' },
    { href: '/admin/finance/transactions', label: 'Ledger', icon: '📓' },
    { href: '/admin/finance/inventory', label: 'Inventory Value', icon: '📦' },
    { href: '/admin/finance/accounts', label: 'Accounts', icon: '⚙️' },
    { href: '/admin/finance/periods', label: 'Periods', icon: '🔒' },
    { href: '/admin/finance/reports/pnl', label: 'P&L', icon: '📈' },
    { href: '/admin/finance/reports/cashflow', label: 'Cash Flow', icon: '💹' },
    { href: '/admin/finance/reports/balance', label: 'Balance Sheet', icon: '⚖️' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Module Header */}
        <div style={{
            padding: '24px 32px 0 32px',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: '12px', background: '#dcfce7', color: '#166534',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' 
                }}>
                    🏦
                </div>
                <div>
                    <h2 className="font-heading" style={{ fontSize: '24px', margin: 0, color: '#1a3c34' }}>Finance System</h2>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Treasury & Capital Management</p>
                </div>
            </div>
            
            {/* Pill Navigation */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                {financeLinks.map(link => {
                    const isActive = pathname === link.href;
                    return (
                        <Link 
                            key={link.href}
                            href={link.href}
                            className={`admin-tab-pill ${isActive ? 'active' : ''}`} // Assuming this class exists or we style inline
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px', 
                                borderRadius: '999px',
                                fontSize: '14px',
                                fontWeight: 500,
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                background: isActive ? '#1a3c34' : 'rgba(255,255,255,0.6)',
                                color: isActive ? '#fff' : '#4b5563',
                                border: isActive ? '1px solid #1a3c34' : '1px solid rgba(0,0,0,0.05)',
                                whiteSpace: 'nowrap',
                                boxShadow: isActive ? '0 2px 4px rgba(26,60,52,0.2)' : 'none'
                            }}
                        >
                            <span>{link.icon}</span>
                            {link.label}
                        </Link>
                    );
                })}
            </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '0 32px 40px 32px' }}>
            {children}
        </div>
    </div>
  );
}
