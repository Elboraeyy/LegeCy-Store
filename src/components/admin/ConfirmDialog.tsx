'use client';

import { useState } from 'react';
import '@/app/admin/admin.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    const variantColors = {
        danger: { bg: '#991b1b', hover: '#7f1d1d' },
        warning: { bg: '#b76e00', hover: '#92400e' },
        default: { bg: 'var(--admin-bg-dark)', hover: '#142f29' }
    };

    const colors = variantColors[variant];

    return (
        <div className="confirm-dialog-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
                <div className="confirm-dialog-icon">
                    {variant === 'danger' ? '⚠️' : variant === 'warning' ? '❓' : 'ℹ️'}
                </div>
                <h3 className="confirm-dialog-title">{title}</h3>
                <p className="confirm-dialog-message">{message}</p>
                <div className="confirm-dialog-actions">
                    <button 
                        className="admin-btn admin-btn-outline" 
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button 
                        className="admin-btn"
                        style={{ 
                            background: colors.bg, 
                            color: '#fff',
                            opacity: loading ? 0.7 : 1 
                        }}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
