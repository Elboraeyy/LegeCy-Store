'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getNotifications, NotificationItem } from '@/lib/actions/notifications';
import '@/app/admin/admin.css';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [count, setCount] = useState(0);

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                const data = await getNotifications();
                if (isMounted) {
                    setNotifications(data.items);
                    setCount(data.counts.total);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.notification-dropdown')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    const getIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'order': return '🛍️';
            case 'stock': return '📦';
            case 'system': return 'ℹ️';
            default: return '🔔';
        }
    };

    return (
        <div className="notification-dropdown">
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontSize: '20px'
                }}
            >
                🔔
                {count > 0 && (
                    <span className="notification-badge">{count > 9 ? '9+' : count}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-panel">
                    <div className="notification-header">
                        Notifications
                        {count > 0 && (
                            <span style={{ 
                                marginLeft: '8px', 
                                fontSize: '11px', 
                                background: '#fee2e2', 
                                color: '#b91c1c', 
                                padding: '2px 8px', 
                                borderRadius: '99px' 
                            }}>
                                {count} new
                            </span>
                        )}
                    </div>

                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <Link
                                key={notif.id}
                                href={notif.link || '#'}
                                className="notification-item"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="notification-icon">{getIcon(notif.type)}</div>
                                <div className="notification-content">
                                    <div className="notification-title">{notif.title}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>
                                        {notif.message}
                                    </div>
                                    <div className="notification-time">{formatTime(notif.createdAt)}</div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>✨</div>
                            <div style={{ fontSize: '13px' }}>All caught up!</div>
                        </div>
                    )}

                    <div style={{ 
                        padding: '12px 16px', 
                        borderTop: '1px solid var(--admin-border)', 
                        textAlign: 'center' 
                    }}>
                        <Link 
                            href="/admin/orders?status=pending"
                            style={{ fontSize: '12px', color: 'var(--admin-accent)' }}
                            onClick={() => setIsOpen(false)}
                        >
                            View all pending orders →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
