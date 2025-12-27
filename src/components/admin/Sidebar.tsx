'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminLogout } from '@/lib/actions/admin-auth';

// SVG Icons as components
const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    orders: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    ),
    products: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    inventory: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18" />
        </svg>
    ),
    customers: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    settings: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    logout: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

interface NavItem {
    href: string;
    label: string;
    icon: keyof typeof icons;
}

const mainNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/orders', label: 'Orders', icon: 'orders' },
    { href: '/admin/products', label: 'Products', icon: 'products' },
    { href: '/admin/inventory', label: 'Inventory', icon: 'inventory' },
];

const secondaryNavItems: NavItem[] = [
    { href: '/admin/categories', label: 'Categories', icon: 'settings' }, // Used 'settings' icon tentatively
    { href: '/admin/brands', label: 'Brands', icon: 'settings' },
    { href: '/admin/materials', label: 'Materials', icon: 'inventory' },
    { href: '/admin/customers', label: 'Customers', icon: 'customers' },
    { href: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export function AdminSidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <aside className="admin-sidebar">
            {/* Logo */}
            <div className="admin-brand">
                <div className="brand-icon">L</div>
                <div>
                    <span className="brand-text">LegeCy</span>
                    <span className="brand-badge">Admin</span>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="admin-nav">
                <div className="admin-nav-section">
                    <div className="admin-nav-label">Main Menu</div>
                    {mainNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <span className="admin-nav-icon">{icons[item.icon]}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className="admin-nav-section">
                    <div className="admin-nav-label">Management</div>
                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`admin-nav-item ${isActive(item.href) ? 'active' : ''}`}
                        >
                            <span className="admin-nav-icon">{icons[item.icon]}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Logout */}
            <div className="admin-logout-wrapper">
                <form action={adminLogout}>
                    <button type="submit" className="admin-logout-btn">
                        <span className="admin-nav-icon">{icons.logout}</span>
                        <span>Logout</span>
                    </button>
                </form>
            </div>
        </aside>
    );
}
