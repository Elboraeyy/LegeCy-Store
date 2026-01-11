"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';
import NotificationDropdown from '@/components/admin/NotificationDropdown';
import KeyboardShortcuts from '@/components/admin/KeyboardShortcuts';
import { AdminProfileProvider, useAdminProfile } from '@/components/admin/AdminProfileContext';

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
            <div className="admin-shell">
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
                        <NavLink href="/admin" icon="🏠" label="Dashboard" active={pathname === '/admin'} onClick={closeSidebar} />
                        <NavLink href="/admin/daily" icon="📅" label="Daily Report" active={pathname?.startsWith('/admin/daily')} onClick={closeSidebar} />
                        
                        {/* Store Section */}
                        <div className="nav-label">Store</div>
                        <NavLink href="/admin/orders" icon="🛍️" label="Orders" active={pathname?.startsWith('/admin/orders')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/orders') && (
                            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/orders/returns" icon="↩️" label="Returns" active={pathname === '/admin/orders/returns'} onClick={closeSidebar} />
                                <NavLink href="/admin/orders/returns/intelligence" icon="📊" label="Returns Analytics" active={pathname === '/admin/orders/returns/intelligence'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/products" icon="📦" label="Products" active={pathname?.startsWith('/admin/products')} onClick={closeSidebar} />
                        <NavLink href="/admin/categories" icon="📁" label="Categories" active={pathname?.startsWith('/admin/categories')} onClick={closeSidebar} />
                        <NavLink href="/admin/customers" icon="👥" label="Customers" active={pathname?.startsWith('/admin/customers')} onClick={closeSidebar} />
                        <NavLink href="/admin/reviews" icon="⭐" label="Reviews" active={pathname?.startsWith('/admin/reviews')} onClick={closeSidebar} />
                        
                        {/* Marketing Section */}
                        <div className="nav-label">Marketing</div>
                        <NavLink href="/admin/promos" icon="🎟️" label="Promos & Discounts" active={pathname?.startsWith('/admin/promos')} onClick={closeSidebar} />
                        
                        {/* Operations Section */}
                        <div className="nav-label">Operations</div>
                        <NavLink href="/admin/inventory" icon="📊" label="Inventory" active={pathname?.startsWith('/admin/inventory')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/inventory') && (
                            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/inventory/warehouses" icon="🏭" label="Warehouses" active={pathname === '/admin/inventory/warehouses'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/transfers" icon="🔄" label="Transfers" active={pathname === '/admin/inventory/transfers'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/alerts" icon="⚠️" label="Alerts" active={pathname === '/admin/inventory/alerts'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/counts" icon="🔢" label="Stock Counts" active={pathname === '/admin/inventory/counts'} onClick={closeSidebar} />
                                <NavLink href="/admin/inventory/reports" icon="📈" label="Reports" active={pathname === '/admin/inventory/reports'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/procurement" icon="🚛" label="Procurement" active={pathname?.startsWith('/admin/procurement')} onClick={closeSidebar} />
                        
                        {/* Finance Section */}
                        <div className="nav-label">Finance</div>
                        <NavLink href="/admin/finance" icon="💰" label="Treasury" active={pathname?.startsWith('/admin/finance') && !pathname?.includes('/reports') && !pathname?.includes('/periods')} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/periods" icon="📅" label="Periods" active={pathname === '/admin/finance/periods'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/pnl" icon="📊" label="P&L Report" active={pathname === '/admin/finance/reports/pnl'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/cashflow" icon="💵" label="Cash Flow" active={pathname === '/admin/finance/reports/cashflow'} onClick={closeSidebar} />
                        <NavLink href="/admin/finance/reports/balance" icon="⚖️" label="Balance Sheet" active={pathname === '/admin/finance/reports/balance'} onClick={closeSidebar} />
                        
                        {/* System Section */}
                        <div className="nav-label">System</div>
                        <NavLink href="/admin/team" icon="👨‍💼" label="Team" active={pathname?.startsWith('/admin/team')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/team') && (
                            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/team/approvals" icon="✅" label="Approvals" active={pathname === '/admin/team/approvals'} onClick={closeSidebar} />
                            </div>
                        )}
                        <NavLink href="/admin/analytics" icon="📈" label="Analytics" active={pathname?.startsWith('/admin/analytics')} onClick={closeSidebar} />
                        <NavLink href="/admin/activity" icon="📋" label="Activity Log" active={pathname?.startsWith('/admin/activity')} onClick={closeSidebar} />
                        <NavLink href="/admin/config" icon="⚙️" label="Settings" active={pathname?.startsWith('/admin/config')} onClick={closeSidebar} />
                        {pathname?.startsWith('/admin/config') && (
                            <div style={{ marginLeft: '24px', marginBottom: '8px' }}>
                                <NavLink href="/admin/config/security" icon="🔐" label="Security" active={pathname === '/admin/config/security'} onClick={closeSidebar} />
                            </div>
                        )}
                        
                        <div style={{ flex: 1 }}></div>

                        <form action="/api/admin/logout" method="POST" style={{ marginTop: 'auto', marginBottom: '16px', display: 'flex', justifyContent: 'center', paddingRight: '30px' }}>
                             <button type="submit" className="admin-logout-btn">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16,17 21,12 16,7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                <span>Logout</span>
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

