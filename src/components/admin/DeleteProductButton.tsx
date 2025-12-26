'use client';

import { deleteProductAction } from '@/lib/actions/product';
import { useTransition } from 'react';

export default function DeleteProductButton({ productId }: { productId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        startTransition(async () => {
            const result = await deleteProductAction(productId);
            if (!result.success) {
                alert(result.error);
            }
        });
    };

    return (
        <button 
            onClick={handleDelete}
            disabled={isPending}
            className="admin-btn-outline"
            style={{ 
                color: '#cc0000', 
                borderColor: 'transparent',
                background: 'transparent',
                cursor: 'pointer',
                padding: '8px',
                border: 'none',
                opacity: isPending ? 0.3 : 0.6,
                transition: 'all 0.2s'
            }}
            title="Delete Product"
        >
            {isPending ? '⏳' : '🗑️'}
        </button>
    );
}
