'use client';

import { useEffect, useState } from 'react';

interface AdminUser {
    name: string;
    email: string;
    role: string;
}

import { useLanguage } from '@/context/LanguageContext';

export function AdminHeader() {
    const { t } = useLanguage();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        // Fetch current admin user
        fetch('/api/admin/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setUser({
                        name: data.name || 'Admin',
                        email: data.email || '',
                        role: data.role?.name || 'Administrator'
                    });
                }
            })
            .catch(() => {});
    }, []);

    const initials = user?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AD';

    return (
        <header className="admin-header w-full">
            {/* Search */}
            <div className="w-full md:max-w-[400px] flex-1">
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-[var(--admin-radius)] w-full">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2" className="flex-shrink-0">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder={t.admin.header.search_placeholder}
                        className="bg-transparent border-none outline-none text-[var(--admin-text)] text-sm w-full min-w-0"
                    />
                    <kbd className="px-1.5 py-0.5 bg-[var(--admin-border)] rounded text-[11px] text-[var(--admin-text-muted)] flex-shrink-0">⌘K</kbd>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center justify-between w-full md:w-auto md:justify-end gap-4 mt-4 md:mt-0">
                {/* Notifications */}
                <button style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--admin-radius)',
                    border: '1px solid var(--admin-border)',
                    background: 'var(--admin-card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '8px',
                        height: '8px',
                        background: 'var(--admin-error)',
                        borderRadius: '50%',
                    }} />
                </button>

                {/* User Menu */}
                <div 
                    className="admin-user"
                    onClick={() => setShowMenu(!showMenu)}
                    style={{ position: 'relative' }}
                >
                    <div className="admin-user-avatar">{initials}</div>
                    <div className="admin-user-info">
                        <div className="admin-user-name">{user?.name || 'Loading...'}</div>
                        <div className="admin-user-role">{user?.role || 'Admin'}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9" />
                    </svg>

                    {/* Dropdown */}
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            minWidth: '180px',
                            background: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: 'var(--admin-radius)',
                            padding: '8px',
                            zIndex: 100,
                        }}>
                            <div style={{ 
                                padding: '8px 12px', 
                                fontSize: '12px', 
                                color: 'var(--admin-text-muted)',
                                borderBottom: '1px solid var(--admin-border)',
                                marginBottom: '8px'
                            }}>
                                {user?.email}
                            </div>
                            <a href="/admin/settings" style={{
                                display: 'block',
                                padding: '8px 12px',
                                fontSize: '14px',
                                color: 'var(--admin-text-secondary)',
                                textDecoration: 'none',
                                borderRadius: '6px',
                            }}>{t.admin.header.settings}</a>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
