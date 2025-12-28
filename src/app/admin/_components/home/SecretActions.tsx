'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface SecretActionsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SecretActions({ isOpen, onClose }: SecretActionsProps) {
    const [confirming, setConfirming] = useState<string | null>(null);

    const actions = [
        {
            id: 'cache',
            icon: '🗑️',
            label: 'Flush Cache',
            description: 'Clear all cached data and force refresh',
            danger: false,
            action: () => {
                localStorage.clear();
                sessionStorage.clear();
                toast.success('Cache cleared successfully!');
                window.location.reload();
            }
        },
        {
            id: 'maintenance',
            icon: '🔧',
            label: 'Maintenance Mode',
            description: 'Toggle store maintenance mode (coming soon)',
            danger: false,
            action: () => {
                toast.info('Maintenance mode feature coming soon!');
            }
        },
        {
            id: 'export',
            icon: '📦',
            label: 'Export Data',
            description: 'Download full data export (coming soon)',
            danger: false,
            action: () => {
                toast.info('Export feature coming soon!');
            }
        },
        {
            id: 'panic',
            icon: '🚨',
            label: 'Panic Button',
            description: 'Emergency: Pause all incoming orders',
            danger: true,
            action: () => {
                toast.warning('Panic mode activated! (Demo only)');
                setConfirming(null);
            }
        }
    ];

    const handleAction = (action: typeof actions[0]) => {
        if (action.danger && confirming !== action.id) {
            setConfirming(action.id);
            return;
        }
        action.action();
        setConfirming(null);
    };

    if (!isOpen) return null;

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div 
                onClick={e => e.stopPropagation()}
                className="admin-card"
                style={{
                    width: '90%',
                    maxWidth: '600px',
                    background: 'var(--admin-bg-dark)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    padding: '32px',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '40px' }}>🔐</span>
                        <div>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: 'var(--admin-accent)', margin: 0 }}>
                                The Vault
                            </h2>
                            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                Classified Operations
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            color: 'rgba(255, 255, 255, 0.6)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    {actions.map(action => (
                        <button
                            key={action.id}
                            onClick={() => handleAction(action)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '20px',
                                background: confirming === action.id ? 'rgba(153, 27, 27, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: `1px solid ${action.danger ? 'rgba(153, 27, 27, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: 'var(--admin-radius-sm)',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: '28px' }}>{action.icon}</span>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                                    {confirming === action.id ? 'Click to confirm' : action.label}
                                </div>
                                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px' }}>
                                    {action.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Warning */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    padding: '16px', 
                    background: 'rgba(183, 110, 0, 0.1)', 
                    borderRadius: 'var(--admin-radius-sm)',
                    fontSize: '12px',
                    color: '#b76e00'
                }}>
                    <span>⚠️</span>
                    <span>Actions here may have significant effects. Proceed with caution.</span>
                </div>
            </div>
        </div>
    );
}
