'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/admin/admin.css';

const shortcuts = [
    { key: 'k', ctrl: true, label: 'Quick Search', action: 'search' },
    { key: 'n', ctrl: true, label: 'New Product', action: 'newProduct' },
    { key: 'o', ctrl: true, label: 'Go to Orders', action: 'orders' },
    { key: 'p', ctrl: true, label: 'Go to Products', action: 'products' },
    { key: '/', ctrl: false, label: 'Show Shortcuts', action: 'showHelp' },
];

const quickLinks = [
    { label: 'Dashboard', href: '/admin', icon: '📊' },
    { label: 'Orders', href: '/admin/orders', icon: '🛍️' },
    { label: 'Products', href: '/admin/products', icon: '📦' },
    { label: 'Customers', href: '/admin/customers', icon: '👥' },
    { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
    { label: 'Categories', href: '/admin/categories', icon: '📁' },
    { label: 'Activity Log', href: '/admin/activity', icon: '📋' },
    { label: 'New Product', href: '/admin/products/new', icon: '➕' },
];

export default function KeyboardShortcuts() {
    const router = useRouter();
    const [showSearch, setShowSearch] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [prevQuery, setPrevQuery] = useState('');

    const filteredLinks = useMemo(() => 
        quickLinks.filter(link =>
            link.label.toLowerCase().includes(searchQuery.toLowerCase())
        ), [searchQuery]);

    // Reset index when search changes - done during render, not in effect
    if (searchQuery !== prevQuery) {
        setPrevQuery(searchQuery);
        setSelectedIndex(0);
    }

    const handleAction = useCallback((action: string) => {
        switch (action) {
            case 'search':
                setShowSearch(true);
                setSearchQuery('');
                break;
            case 'newProduct':
                router.push('/admin/products/new');
                break;
            case 'orders':
                router.push('/admin/orders');
                break;
            case 'products':
                router.push('/admin/products');
                break;
            case 'showHelp':
                setShowHelp(true);
                break;
        }
    }, [router]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                if (e.key !== 'Escape') return;
            }

            if (e.key === 'Escape') {
                setShowSearch(false);
                setShowHelp(false);
                return;
            }

            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey;
                if (e.key.toLowerCase() === shortcut.key && ctrlMatch) {
                    e.preventDefault();
                    handleAction(shortcut.action);
                    return;
                }
            }

            if (showSearch) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredLinks.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter' && filteredLinks[selectedIndex]) {
                    e.preventDefault();
                    router.push(filteredLinks[selectedIndex].href);
                    setShowSearch(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleAction, showSearch, filteredLinks, selectedIndex, router]);

    return (
        <>
            {showSearch && (
                <div 
                    className="quick-search-overlay" 
                    onClick={() => setShowSearch(false)}
                >
                    <div className="quick-search-modal" onClick={e => e.stopPropagation()}>
                        <div className="quick-search-input-wrapper">
                            <span style={{ fontSize: '18px', color: 'var(--admin-text-muted)' }}>🔍</span>
                            <input
                                type="text"
                                className="quick-search-input"
                                placeholder="Search or jump to..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <span className="quick-search-shortcut">ESC</span>
                        </div>
                        <div className="quick-search-results">
                            <div className="quick-search-section">
                                <div className="quick-search-section-title">Quick Navigation</div>
                                {filteredLinks.map((link, index) => (
                                    <div
                                        key={link.href}
                                        className={`quick-search-item ${index === selectedIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            router.push(link.href);
                                            setShowSearch(false);
                                        }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <span className="quick-search-item-icon">{link.icon}</span>
                                        <span className="quick-search-item-label">{link.label}</span>
                                    </div>
                                ))}
                                {filteredLinks.length === 0 && (
                                    <div style={{ padding: '16px 20px', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                                        No results found
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showHelp && (
                <div 
                    className="quick-search-overlay" 
                    onClick={() => setShowHelp(false)}
                >
                    <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ 
                            margin: '0 0 8px 0', 
                            fontFamily: 'Playfair Display, serif',
                            fontSize: '22px' 
                        }}>
                            Keyboard Shortcuts
                        </h2>
                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', margin: 0 }}>
                            Speed up your workflow
                        </p>
                        <div className="shortcuts-grid">
                            {shortcuts.map((shortcut) => (
                                <div key={shortcut.key} className="shortcut-row">
                                    <span>{shortcut.label}</span>
                                    <span className="shortcut-key">
                                        {shortcut.ctrl && <kbd>Ctrl</kbd>}
                                        <kbd>{shortcut.key.toUpperCase()}</kbd>
                                    </span>
                                </div>
                            ))}
                            <div className="shortcut-row">
                                <span>Close Modal</span>
                                <span className="shortcut-key"><kbd>ESC</kbd></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
