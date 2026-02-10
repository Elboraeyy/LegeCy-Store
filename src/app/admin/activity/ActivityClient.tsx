'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
import EmptyState from '@/components/admin/EmptyState';
import '@/app/admin/admin.css';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    ipAddress: string | null;
    createdAt: string;
    admin: { name: string | null; email: string } | null;
}

interface ActivityClientProps {
    logs: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
    actionFilter: string;
}

export default function ActivityClient({ logs, total, page, totalPages, actionFilter }: ActivityClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];


    const actionIcons: Record<string, string> = {
        'LOGIN': '🔐',
        'CREATE_PRODUCT': '➕',
        'UPDATE_PRODUCT': '✏️',
        'DELETE_PRODUCT': '🗑️',
        'CREATE_CATEGORY': '📁',
        'UPDATE_CATEGORY': '📁',
        'DELETE_CATEGORY': '🗑️',
        'UPDATE_ORDER_STATUS': '📦',
        'CREATE_ORDER_NOTE': '📝',
        'DEFAULT': '📋'
    };

    const getActionIcon = (action: string) => {
        return actionIcons[action] || actionIcons['DEFAULT'];
    };

    const buildUrl = (params: Record<string, string | number | undefined>) => {
        const urlParams = new URLSearchParams();
        if (params.action) urlParams.set('action', String(params.action));
        if (typeof params.page === 'number' && params.page > 1) urlParams.set('page', String(params.page));
        const query = urlParams.toString();
        return `/admin/activity${query ? `?${query}` : ''}`;
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.activity?.title || 'Activity Log'}</h1>
                    <p className="admin-subtitle">{t.activity?.subtitle || 'Track all admin actions and changes'}</p>
                </div>
                <span style={{
                    fontSize: '13px',
                    color: 'var(--admin-text-muted)',
                    background: '#fff',
                    padding: '8px 16px',
                    borderRadius: '99px',
                    border: '1px solid var(--admin-border)'
                }}>
                    {total} {t.activity?.total_events || 'Total Events'}
                </span>
            </div>

            {/* Filters */}
            <div className="admin-toolbar" style={{ marginBottom: '24px' }}>
                <div className="admin-tabs-container">
                    <Link
                        href={buildUrl({})}
                        className={`admin-tab-pill ${!actionFilter ? 'active' : ''}`}
                    >
                        {t.activity?.filters?.all || 'All Actions'}
                    </Link>
                    <Link
                        href={buildUrl({ action: 'LOGIN' })}
                        className={`admin-tab-pill ${actionFilter === 'LOGIN' ? 'active' : ''}`}
                    >
                        {t.activity?.filters?.logins || 'Logins'}
                    </Link>
                    <Link
                        href={buildUrl({ action: 'PRODUCT' })}
                        className={`admin-tab-pill ${actionFilter === 'PRODUCT' ? 'active' : ''}`}
                    >
                        {t.activity?.filters?.products || 'Products'}
                    </Link>
                    <Link
                        href={buildUrl({ action: 'ORDER' })}
                        className={`admin-tab-pill ${actionFilter === 'ORDER' ? 'active' : ''}`}
                    >
                        {t.activity?.filters?.orders || 'Orders'}
                    </Link>
                </div>
            </div>

            {/* Activity Log */}
            {logs.length > 0 ? (
                <div className="admin-card" style={{ padding: 0 }}>
                    {logs.map((log, index) => (
                        <div
                            key={log.id}
                            style={{
                                padding: '16px 24px',
                                borderBottom: index < logs.length - 1 ? '1px solid var(--admin-border)' : 'none',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '16px'
                            }}
                        >
                            <div style={{
                                fontSize: '24px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--admin-surface-light)',
                                borderRadius: '50%',
                                flexShrink: 0
                            }}>
                                {getActionIcon(log.action)}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                        {log.admin?.name || log.admin?.email || (t.activity?.unknown || 'Unknown')}
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        background: '#f0f0f0',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace'
                                    }}>
                                        {log.action.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>
                                    {log.entityType} {log.entityId ? `#${log.entityId.slice(0, 8)}` : ''}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999' }}>
                                    {new Date(log.createdAt).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                                    {log.ipAddress && <span style={{ marginInlineStart: '12px' }}>IP: {log.ipAddress}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="📋"
                    title={t.activity?.no_activity || 'No activity yet'}
                    description={t.activity?.no_activity_desc || 'Admin actions will appear here once there\'s activity'}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '40px' }}>
                    <Link
                        href={buildUrl({ action: actionFilter, page: page - 1 })}
                        className={`admin-btn admin-btn-outline ${page <= 1 ? 'disabled' : ''}`}
                        style={{ pointerEvents: page <= 1 ? 'none' : 'auto', opacity: page <= 1 ? 0.5 : 1 }}
                    >
                        {language === 'ar' ? 'السابق' : 'Previous'}
                    </Link>
                    <span style={{ padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <Link
                        href={buildUrl({ action: actionFilter, page: page + 1 })}
                        className={`admin-btn admin-btn-outline ${page >= totalPages ? 'disabled' : ''}`}
                        style={{ pointerEvents: page >= totalPages ? 'none' : 'auto', opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                        {language === 'ar' ? 'التالي' : 'Next'}
                    </Link>
                </div>
            )}
        </div>
    );
}
