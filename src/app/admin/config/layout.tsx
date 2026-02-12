'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

export default function SettingsLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];

    const settingsSections = [
        { href: '/admin/config/general', label: t.config?.general?.title || 'General', icon: '⚙️', description: t.config?.general?.desc || 'Basic store information' },
        { href: '/admin/config/appearance', label: t.config?.appearance?.title || 'Appearance', icon: '🎨', description: t.config?.appearance?.desc || 'Theme and styling' },
        { href: '/admin/config/pages', label: t.config?.pages?.title || 'Page Builder', icon: '📑', description: t.config?.pages?.desc || 'Customize all pages' },
        { href: '/admin/config/homepage', label: t.config?.homepage?.title || 'Homepage', icon: '🏠', description: t.config?.homepage?.desc || 'Homepage sections' },
        { href: '/admin/config/products', label: t.config?.products?.title || 'Products', icon: '📦', description: t.config?.products?.desc || 'Catalog settings' },
        { href: '/admin/config/orders', label: t.config?.orders?.title || 'Orders', icon: '🛒', description: t.config?.orders?.desc || 'Checkout & returns' },
        { href: '/admin/config/customers', label: t.config?.customers?.title || 'Customers', icon: '👥', description: t.config?.customers?.desc || 'Accounts & loyalty' },
        { href: '/admin/config/coupons', label: t.config?.coupons?.title || 'Coupons', icon: '🎫', description: t.config?.coupons?.desc || 'Discounts & gift cards' },
        { href: '/admin/config/reviews', label: t.config?.reviews?.title || 'Reviews', icon: '⭐', description: t.config?.reviews?.desc || 'Ratings & feedback' },
        { href: '/admin/config/notifications', label: t.config?.notifications?.title || 'Notifications', icon: '📧', description: t.config?.notifications?.desc || 'Email and alerts' },
        { href: '/admin/config/payments', label: t.config?.payments?.title || 'Payments', icon: '💳', description: t.config?.payments?.desc || 'Payment gateways' },
        { href: '/admin/config/shipping', label: t.config?.shipping?.title || 'Shipping', icon: '🚚', description: t.config?.shipping?.desc || 'Shipping methods' },
        { href: '/admin/config/seo', label: t.config?.seo?.title || 'SEO & Social', icon: '🔍', description: t.config?.seo?.desc || 'Search and social' },
        { href: '/admin/config/security', label: t.config?.security?.title || 'Security', icon: '🔒', description: t.config?.security?.desc || 'Security policies' },
        { href: '/admin/config/localization', label: t.config?.localization?.title || 'Localization', icon: '🌍', description: t.config?.localization?.desc || 'Languages and formats' },

        { href: '/admin/config/performance', label: t.config?.performance?.title || 'Performance', icon: '⚡', description: t.config?.performance?.desc || 'Speed & caching' },

    ];

    return (
        <div className="settings-layout">
            <aside className="settings-sidebar">
                <div className="settings-sidebar-header">
                    <h2 className="settings-sidebar-title">{t.config?.settings_title || 'Settings'}</h2>
                    <p className="settings-sidebar-subtitle">{t.config?.settings_subtitle || 'Manage your store configuration'}</p>
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

