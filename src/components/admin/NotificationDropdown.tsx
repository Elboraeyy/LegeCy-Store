'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getNotifications, NotificationItem } from '@/lib/actions/notifications';
import '@/app/admin/admin.css';

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [count, setCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const getPriorityColor = (type: NotificationItem['type']) => {
        switch (type) {
            case 'order': return '#d4af37';
            case 'stock': return '#ea580c';
            case 'system': return '#2563eb';
            default: return '#6b7280';
        }
    };

    return (
        <div className="notification-dropdown" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: isOpen ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    fontSize: '20px',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = isOpen ? 'rgba(212, 175, 55, 0.15)' : 'transparent'}
            >
                🔔
                {count > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '99px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)'
                    }}>
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '80px',
                        left: 'var(--sidebar-width, 260px)',
                        width: '380px',
                        maxHeight: 'calc(100vh - 120px)',
                        background: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                        overflow: 'hidden',
                        zIndex: 1001,
                        animation: 'slideIn 0.2s ease'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '20px 20px 16px',
                        background: 'linear-gradient(135deg, #1a3c34, #2d5a4e)',
                        color: '#fff'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Notifications</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>
                                    Stay updated with your store
                                </p>
                            </div>
                            {count > 0 && (
                                <span style={{ 
                                    background: 'rgba(255,255,255,0.2)', 
                                    padding: '6px 12px', 
                                    borderRadius: '99px',
                                    fontSize: '12px',
                                    fontWeight: 600
                                }}>
                                    {count} new
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {notifications.length > 0 ? (
                            notifications.map((notif, index) => (
                                <Link
                                    key={notif.id}
                                    href={notif.link || '#'}
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '14px',
                                        padding: '16px 20px',
                                        borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: `${getPriorityColor(notif.type)}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        flexShrink: 0
                                    }}>
                                        {getIcon(notif.type)}
                                    </div>
                                    
                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontSize: '14px', 
                                            fontWeight: 600, 
                                            color: '#1f2937',
                                            marginBottom: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            {notif.title}
                                            <span style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: getPriorityColor(notif.type),
                                                flexShrink: 0
                                            }} />
                                        </div>
                                        <div style={{ 
                                            fontSize: '13px', 
                                            color: '#6b7280',
                                            lineHeight: 1.4,
                                            marginBottom: '6px'
                                        }}>
                                            {notif.message}
                                        </div>
                                        <div style={{ 
                                            fontSize: '11px', 
                                            color: '#9ca3af',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <span>🕐</span>
                                            {formatTime(notif.createdAt)}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div style={{ 
                                padding: '48px 20px', 
                                textAlign: 'center' 
                            }}>
                                <div style={{ 
                                    width: '64px', 
                                    height: '64px', 
                                    borderRadius: '50%',
                                    background: '#f0fdf4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px',
                                    fontSize: '28px'
                                }}>
                                    ✨
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                                    All caught up!
                                </div>
                                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    No new notifications
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ 
                        padding: '14px 20px', 
                        borderTop: '1px solid #f3f4f6',
                        background: '#fafafa',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Link 
                            href="/admin/orders?status=pending"
                            onClick={() => setIsOpen(false)}
                            style={{ 
                                fontSize: '13px', 
                                color: '#1a3c34',
                                fontWeight: 500,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            📋 View pending orders
                        </Link>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: '#1a3c34',
                                color: '#fff',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>
        </div>
    );
}
