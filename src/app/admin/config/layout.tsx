'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const settingsSections = [
    { href: '/admin/config/general', label: 'General', icon: '⚙️', description: 'Basic store information' },
    { href: '/admin/config/appearance', label: 'Appearance', icon: '🎨', description: 'Theme and styling' },
    { href: '/admin/config/pages', label: 'Page Builder', icon: '📑', description: 'Customize all pages' },
    { href: '/admin/config/homepage', label: 'Homepage', icon: '🏠', description: 'Homepage sections' },
    { href: '/admin/config/products', label: 'Products', icon: '📦', description: 'Catalog settings' },
    { href: '/admin/config/orders', label: 'Orders', icon: '🛒', description: 'Checkout & returns' },
    { href: '/admin/config/customers', label: 'Customers', icon: '👥', description: 'Accounts & loyalty' },
    { href: '/admin/config/coupons', label: 'Coupons', icon: '🎫', description: 'Discounts & gift cards' },
    { href: '/admin/config/reviews', label: 'Reviews', icon: '⭐', description: 'Ratings & feedback' },
    { href: '/admin/config/notifications', label: 'Notifications', icon: '📧', description: 'Email and alerts' },
    { href: '/admin/config/payments', label: 'Payments', icon: '💳', description: 'Payment gateways' },
    { href: '/admin/config/shipping', label: 'Shipping', icon: '🚚', description: 'Shipping methods' },
    { href: '/admin/config/seo', label: 'SEO & Social', icon: '🔍', description: 'Search and social' },
    { href: '/admin/config/security', label: 'Security', icon: '🔒', description: 'Security policies' },
    { href: '/admin/config/taxes', label: 'Taxes', icon: '💰', description: 'Tax configuration' },
    { href: '/admin/config/localization', label: 'Localization', icon: '🌍', description: 'Languages and formats' },
    { href: '/admin/config/integrations', label: 'Integrations', icon: '🔗', description: 'APIs and webhooks' },
    { href: '/admin/config/performance', label: 'Performance', icon: '⚡', description: 'Speed & caching' },
    { href: '/admin/config/analytics', label: 'Analytics', icon: '📊', description: 'Tracking & reports' },
    { href: '/admin/config/backup', label: 'Backup', icon: '💾', description: 'Backup & recovery' },
    { href: '/admin/config/maintenance', label: 'Maintenance', icon: '🔧', description: 'Maintenance mode' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="settings-layout">
            <aside className="settings-sidebar">
                <div className="settings-sidebar-header">
                    <h2 className="settings-sidebar-title">Settings</h2>
                    <p className="settings-sidebar-subtitle">Manage your store configuration</p>
                </div>
                <nav className="settings-nav">
                    {settingsSections.map((section) => {
                        const isActive = pathname === section.href || 
                            (pathname === '/admin/config' && section.href === '/admin/config/general');
                        
                        return (
                            <Link
                                key={section.href}
                                href={section.href}
                                className={`settings-nav-item ${isActive ? 'settings-nav-item--active' : ''}`}
                            >
                                <span className="settings-nav-icon">{section.icon}</span>
                                <div className="settings-nav-text">
                                    <span className="settings-nav-label">{section.label}</span>
                                    <span className="settings-nav-description">{section.description}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="settings-content">
                {children}
            </main>
        </div>
    );
}
