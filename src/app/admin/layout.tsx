"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';
import NotificationDropdown from '@/components/admin/NotificationDropdown';
import KeyboardShortcuts from '@/components/admin/KeyboardShortcuts';
import { AdminProfileProvider, useAdminProfile } from '@/components/admin/AdminProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

function SidebarProfile() {
    const { profile, loading } = useAdminProfile();

    // Use username if available, otherwise fall back to name
    const displayName = profile?.username || profile?.name || 'Admin User';
    const displayRole = profile?.role || 'Administrator';
    const displayInitial = displayName.charAt(0).toUpperCase();

    return (
        <div className="sidebar-profile">
            <Link href="/admin/profile" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                textDecoration: 'none',
                color: 'inherit',
                flex: 1,
                padding: '8px',
                marginLeft: '-8px',
                borderRadius: '8px',
                transition: 'background 0.2s'
            }}
            className="profile-link"
            >
                <div 
                    className="profile-avatar"
                    style={profile?.avatar ? {
                        backgroundImage: `url(${profile.avatar})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    } : undefined}
                >
                    {!profile?.avatar && <span>{loading ? '...' : displayInitial}</span>}
                </div>
                <div className="profile-info">
                    <div className="profile-name">{loading ? '...' : displayName}</div>
                    <div className="profile-role">{loading ? '...' : displayRole}</div>
                </div>
            </Link>
            <NotificationDropdown />
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname?.includes('/login');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { language, setLanguage, direction } = useLanguage();
    const t = adminDictionary[language];

    // Check local storage for language ONLY on client mount (handled by Context)
    // but we need to ensure the layout re-renders when language changes

    const closeSidebar = () => setSidebarOpen(false);

    // Prevent scrolling when sidebar is open on mobile
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [sidebarOpen]);

    if (isLogin) {
        return <div className="admin-login-wrapper">{children}</div>;
    }

    return (
        <AdminProfileProvider>
            <div className="admin-shell" dir={direction}>
                {/* Keyboard Shortcuts (global listener) */}
                <KeyboardShortcuts />

                {/* Mobile Hamburger Button */}
                <button 
                    className={`mobile-menu-toggle ${sidebarOpen ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>

                {/* Mobile Overlay */}
                <div 
                    className={`mobile-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
                    onClick={closeSidebar}
                />

                {/* Sidebar */}
                <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
                    <Link href="/admin" className="admin-brand" style={{ textDecoration: 'none', display: 'block' }} onClick={closeSidebar}>
                        <div className="brand-text">LEGACY</div>
                    </Link>

                    {/* Profile Section - Now Dynamic */}
                    <SidebarProfile />

                    <nav className="admin-nav">
                        {/* Dashboard - First, No Section Header */}
                        <NavLink href="/admin" icon="🏠" label={t.sidebar.dashboard} active={pathname === '/admin'} onClick={closeSidebar} />
                        <NavLink href="/admin/daily" icon="📅" label={t.sidebar.daily_report} active={pathname?.startsWith('/admin/daily')} onClick={closeSidebar} />
                        
                        {/* Store Section */}
                        <div className="nav-label">{t.sidebar.store}</div>
                        <NavLink href="/admin/orders" icon="🛍️" label={t.sidebar.orders} active={pathname?.startsWith('/admin/orders')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/orders') && (
                            <div style={{ marginInlineStart: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/orders/returns" icon="↩️" label={t.sidebar.returns} active={pathname === '/admin/orders/returns'} onClick={closeSidebar} />
                                <NavLink href="/admin/orders/returns/intelligence" icon="📊" label={t.sidebar.returns_analytics} active={pathname === '/admin/orders/returns/intelligence'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/products" icon="📦" label={t.sidebar.products} active={pathname?.startsWith('/admin/products')} onClick={closeSidebar} />
                        <NavLink href="/admin/categories" icon="📁" label={t.sidebar.categories} active={pathname?.startsWith('/admin/categories')} onClick={closeSidebar} />
                        {/* Customers Section with Nested Items */}
                        <NavLink
                            href="/admin/customers"
                            icon="👥"
                            label={t.sidebar.customers}
                            active={pathname?.startsWith('/admin/customers') || pathname?.startsWith('/admin/reviews') || pathname?.startsWith('/admin/messages')}
                            onClick={closeSidebar}
                        />
                        {(pathname?.startsWith('/admin/customers') || pathname?.startsWith('/admin/reviews') || pathname?.startsWith('/admin/messages')) && (
                            <div style={{ marginInlineStart: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/reviews" icon="⭐" label={t.sidebar.reviews} active={pathname?.startsWith('/admin/reviews')} onClick={closeSidebar} />
                                <NavLink href="/admin/messages" icon="✉️" label={t.sidebar.messages} active={pathname?.startsWith('/admin/messages')} onClick={closeSidebar} />
                            </div>
                        )}
                        
                        {/* Marketing Section */}
                        <div className="nav-label">{t.sidebar.marketing}</div>
                        <NavLink href="/admin/promos" icon="🎟️" label={t.sidebar.promos} active={pathname?.startsWith('/admin/promos')} onClick={closeSidebar} />
                        
                        {/* Operations Section */}
                        <div className="nav-label">{t.sidebar.operations}</div>
                        <NavLink href="/admin/inventory" icon="📊" label={t.sidebar.inventory} active={pathname?.startsWith('/admin/inventory')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/inventory') && (
                            <div style={{ marginInlineStart: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/inventory/warehouses" icon="🏭" label={t.sidebar.warehouses} active={pathname === '/admin/inventory/warehouses'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/transfers" icon="🔄" label={t.sidebar.transfers} active={pathname === '/admin/inventory/transfers'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/requests" icon="📩" label={t.inventory.requests.title} active={pathname === '/admin/inventory/requests'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/alerts" icon="⚠️" label={t.sidebar.alerts} active={pathname === '/admin/inventory/alerts'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/counts" icon="🔢" label={t.sidebar.stock_counts} active={pathname === '/admin/inventory/counts'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/reports" icon="📈" label={t.sidebar.reports} active={pathname === '/admin/inventory/reports'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/procurement" icon="🚛" label={t.sidebar.procurement} active={pathname?.startsWith('/admin/procurement')} onClick={closeSidebar} />
                        
                        {/* Finance Section */}
                        <div className="nav-label">{t.sidebar.finance}</div>
                        <NavLink href="/admin/finance" icon="💰" label={t.sidebar.finance_dashboard} active={pathname === '/admin/finance'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/treasury" icon="🏦" label={t.sidebar.treasury} active={pathname === '/admin/finance/treasury'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/periods" icon="📅" label={t.sidebar.periods} active={pathname === '/admin/finance/periods'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/pnl" icon="📊" label={t.sidebar.pnl} active={pathname === '/admin/finance/reports/pnl'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/cashflow" icon="💵" label={t.sidebar.cashflow} active={pathname === '/admin/finance/reports/cashflow'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/balance" icon="⚖️" label={t.sidebar.balance_sheet} active={pathname === '/admin/finance/reports/balance'} onClick={closeSidebar} />
                        
                        {/* System Section */}
                        <div className="nav-label">{t.sidebar.system}</div>
                        <NavLink href="/admin/team" icon="👨‍💼" label={t.sidebar.team} active={pathname?.startsWith('/admin/team')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/team') && (
                            <div style={{ marginInlineStart: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/team/rankings" icon="🏆" label={t.sidebar.rankings} active={pathname === '/admin/team/rankings'} onClick={closeSidebar} />
                                <NavLink href="/admin/team/payroll" icon="💰" label={t.sidebar.payroll} active={pathname === '/admin/team/payroll'} onClick={closeSidebar} />
                                <NavLink href="/admin/team/approvals" icon="✅" label={t.sidebar.approvals} active={pathname === '/admin/team/approvals'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/analytics" icon="📈" label={t.sidebar.analytics} active={pathname?.startsWith('/admin/analytics')} onClick={closeSidebar} />
                        <NavLink href="/admin/activity" icon="📋" label={t.sidebar.activity} active={pathname?.startsWith('/admin/activity')} onClick={closeSidebar} />
                        <NavLink href="/admin/config" icon="⚙️" label={t.sidebar.settings} active={pathname?.startsWith('/admin/config')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/config') && (
                            <div style={{ marginInlineStart: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/config/security" icon="🔐" label={t.sidebar.security} active={pathname === '/admin/config/security'} onClick={closeSidebar} />
                            </div>
                        )}
                        
                        <div style={{ flex: 1 }}></div>

                        {/* Language Switcher Button */}
                        <button
                            type="button"
                            className="admin-logout-btn"
                            style={{
                                marginTop: '16px',
                                marginBottom: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                        >
                            <span>🌐</span>
                            <span>{language === 'en' ? 'العربية' : 'English'}</span>
                        </button>

                        <form action="/api/admin/logout" method="POST" style={{ marginTop: 'auto', marginBottom: '16px', display: 'flex', justifyContent: 'center', paddingRight: '0' }}>
                             <button type="submit" className="admin-logout-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16,17 21,12 16,7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>{t.sidebar.logout}</span>
                             </button>
                        </form>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="admin-main">
                    {children}
                </main>
            </div>
        </AdminProfileProvider>
    );
}

function NavLink({ href, icon, label, active, onClick }: { href: string; icon: string; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <Link href={href} className={`admin-nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

