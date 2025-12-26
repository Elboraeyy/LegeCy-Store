"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';
import NotificationDropdown from '@/components/admin/NotificationDropdown';
import KeyboardShortcuts from '@/components/admin/KeyboardShortcuts';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLogin = pathname?.includes('/login');

    if (isLogin) {
        return <div className="admin-login-wrapper">{children}</div>;
    }

    return (
        <div className="admin-shell">
            {/* Keyboard Shortcuts (global listener) */}
            <KeyboardShortcuts />

            {/* Sidebar */}
            <aside className="admin-sidebar">
                <Link href="/admin" className="admin-brand" style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="brand-text">LEGACY</div>
                </Link>

                {/* Profile Section */}
                <div className="sidebar-profile">
                    <div className="profile-avatar">
                        <span>A</span>
                    </div>
                    <div className="profile-info">
                        <div className="profile-name">Admin User</div>
                        <div className="profile-role">Administrator</div>
                    </div>
                    <NotificationDropdown />
                </div>

                <nav className="admin-nav">
                    <div className="nav-label">Main Menu</div>
                    <NavLink href="/admin" icon="📊" label="Dashboard" active={pathname === '/admin'} />
                    <NavLink href="/admin/orders" icon="🛍️" label="Orders" active={pathname?.startsWith('/admin/orders')} />
                    <NavLink href="/admin/products" icon="📦" label="Inventory" active={pathname?.startsWith('/admin/products')} />
                    <NavLink href="/admin/customers" icon="👥" label="Customers" active={pathname?.startsWith('/admin/customers')} />
                    <NavLink href="/admin/categories" icon="📁" label="Categories" active={pathname?.startsWith('/admin/categories')} />
                    <NavLink href="/admin/reviews" icon="💬" label="Reviews" active={pathname?.startsWith('/admin/reviews')} />
                    
                    <div className="nav-label">Management</div>
                    <NavLink href="/admin/analytics" icon="📈" label="Analytics" active={pathname?.startsWith('/admin/analytics')} />
                    <NavLink href="/admin/activity" icon="📋" label="Activity Log" active={pathname?.startsWith('/admin/activity')} />
                    <NavLink href="/admin/config" icon="⚙️" label="Settings" active={pathname?.startsWith('/admin/config')} />
                    
                    <div style={{ flex: 1 }}></div>

                    {/* Keyboard Shortcuts Hint */}
                    <div style={{ 
                        padding: '12px 16px', 
                        marginBottom: '8px',
                        fontSize: '11px', 
                        color: 'var(--admin-text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <kbd style={{ 
                            background: 'rgba(255,255,255,0.1)', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontSize: '10px'
                        }}>Ctrl+K</kbd>
                        Quick Search
                    </div>

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
    );
}

function NavLink({ href, icon, label, active }: { href: string; icon: string; label: string; active?: boolean }) {
    return (
        <Link href={href} className={`admin-nav-item ${active ? 'active' : ''}`}>
            <span style={{ fontSize: '16px', opacity: active ? 1 : 0.7 }}>{icon}</span>
            {label}
        </Link>
    );
}
