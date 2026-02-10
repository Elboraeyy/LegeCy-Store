'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface MissionBriefingProps {
    pendingOrders: number;
    activeAlerts: number;
    lowStockCount: number;
    systemStatus: 'nominal' | 'attention' | 'critical';
}

export default function MissionBriefing({ 
    pendingOrders, 
    activeAlerts, 
    lowStockCount,
    systemStatus 
}: MissionBriefingProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language];
    const [stickyNote, setStickyNote] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Load sticky note from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('admin_sticky_note');
        if (saved) {
            const timer = setTimeout(() => setStickyNote(saved), 0);
            return () => clearTimeout(timer);
        }
    }, []);

    // Save sticky note
    const handleSaveNote = () => {
        localStorage.setItem('admin_sticky_note', stickyNote);
        setIsEditing(false);
    };

    // Generate dynamic focus message
    const getFocusMessage = () => {
        const messages: string[] = [];
        if (pendingOrders > 0) messages.push(t.dashboard.pending_orders_action.replace('{count}', pendingOrders.toString()));
        if (activeAlerts > 0) messages.push(t.dashboard.alerts_action.replace('{count}', activeAlerts.toString()));
        if (lowStockCount > 0) messages.push(t.dashboard.low_stock_action.replace('{count}', lowStockCount.toString()));
        
        if (messages.length === 0) return t.dashboard.all_clear;
        return messages.join(' • ');
    };

    const statusConfig = {
        nominal: { label: 'NOMINAL', className: 'status-active' },
        attention: { label: 'ATTENTION', className: 'status-pending' },
        critical: { label: 'CRITICAL', className: 'status-cancelled' }
    };

    const status = statusConfig[systemStatus];

    return (
        <div className="admin-card" style={{ marginBottom: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📋</span>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, margin: 0, color: 'var(--admin-text-on-light)' }}>
                        {t.dashboard.daily_focus}
                    </h2>
                </div>
                <span className={`status-badge ${status.className}`}>
                    {t.dashboard.system_status.replace('{status}', status.label)}
                </span>
            </div>

            {/* Focus Area */}
            <div style={{ 
                background: 'var(--admin-surface-light)', 
                borderRadius: 'var(--admin-radius-sm)', 
                padding: '20px 24px', 
                marginBottom: '20px' 
            }}>
                <div className="stat-label" style={{ marginBottom: '8px' }}>TODAY&apos;S FOCUS</div>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--admin-text-on-light)' }}>
                    {getFocusMessage()}
                </div>
            </div>

            {/* Sticky Note */}
            <div style={{ 
                background: 'var(--admin-surface-light)', 
                borderRadius: 'var(--admin-radius-sm)', 
                padding: '16px 20px',
                border: '1px solid var(--admin-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px' }}>📌</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>{t.dashboard.command_notes}</span>
                    {!isEditing && (
                        <button 
                            className="admin-btn admin-btn-outline"
                            style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '11px' }}
                            onClick={() => setIsEditing(true)}
                        >
                            {t.dashboard.edit}
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div>
                        <textarea
                            className="form-input"
                            value={stickyNote}
                            onChange={(e) => setStickyNote(e.target.value)}
                            placeholder={t.dashboard.no_notes}
                            rows={3}
                            style={{ marginBottom: '12px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                                className="admin-btn admin-btn-outline"
                                onClick={() => setIsEditing(false)}
                            >
                                {t.dashboard.cancel}
                            </button>
                            <button 
                                className="admin-btn admin-btn-primary"
                                onClick={handleSaveNote}
                            >
                                {t.dashboard.save_note}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-on-light)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                            {stickyNote || <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>{t.dashboard.no_notes}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
