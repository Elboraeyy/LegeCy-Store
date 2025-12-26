'use client';

import Link from 'next/link';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export default function EmptyState({
    icon = '📭',
    title,
    description,
    actionLabel,
    actionHref,
    onAction
}: EmptyStateProps) {
    return (
        <div style={{ 
            textAlign: 'center', 
            padding: '60px 40px',
            background: '#fff',
            borderRadius: 'var(--admin-radius)',
            border: '1px solid var(--admin-border)'
        }}>
            <div style={{ 
                fontSize: '56px', 
                marginBottom: '20px', 
                opacity: 0.6,
                filter: 'grayscale(30%)'
            }}>
                {icon}
            </div>
            <h3 style={{ 
                margin: '0 0 8px 0', 
                fontSize: '20px',
                fontFamily: 'Playfair Display, serif',
                color: 'var(--admin-text-on-light)'
            }}>
                {title}
            </h3>
            {description && (
                <p style={{ 
                    color: 'var(--admin-text-muted)', 
                    marginBottom: actionLabel ? '24px' : 0,
                    fontSize: '14px',
                    maxWidth: '300px',
                    margin: '0 auto'
                }}>
                    {description}
                </p>
            )}
            {actionLabel && actionHref && (
                <Link href={actionHref} className="admin-btn admin-btn-primary" style={{ marginTop: '24px' }}>
                    {actionLabel}
                </Link>
            )}
            {actionLabel && onAction && !actionHref && (
                <button onClick={onAction} className="admin-btn admin-btn-primary" style={{ marginTop: '24px' }}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
