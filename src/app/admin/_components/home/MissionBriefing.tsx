'use client';

import { useState, useEffect } from 'react';

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
        if (pendingOrders > 0) messages.push(`${pendingOrders} orders awaiting action`);
        if (activeAlerts > 0) messages.push(`${activeAlerts} alerts need review`);
        if (lowStockCount > 0) messages.push(`${lowStockCount} items running low`);
        
        if (messages.length === 0) return "All systems clear. Great work!";
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
                        Mission Briefing
                    </h2>
                </div>
                <span className={`status-badge ${status.className}`}>
                    SYSTEM {status.label}
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
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-muted)' }}>Command Notes</span>
                    {!isEditing && (
                        <button 
                            className="admin-btn admin-btn-outline"
                            style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '11px' }}
                            onClick={() => setIsEditing(true)}
                        >
                            Edit
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div>
                        <textarea
                            className="form-input"
                            value={stickyNote}
                            onChange={(e) => setStickyNote(e.target.value)}
                            placeholder="Leave notes for yourself or your team..."
                            rows={3}
                            style={{ marginBottom: '12px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                                className="admin-btn admin-btn-outline"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className="admin-btn admin-btn-primary"
                                onClick={handleSaveNote}
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '14px', color: 'var(--admin-text-on-light)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {stickyNote || <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>No notes yet. Click Edit to add one.</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
