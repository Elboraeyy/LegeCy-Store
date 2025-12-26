'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deleteCategoryAction } from '@/lib/actions/category';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import ConfirmDialog from './ConfirmDialog';

interface CategoryActionsProps {
    categoryId: string;
    hasProducts: boolean;
}

export default function CategoryActions({ categoryId, hasProducts }: CategoryActionsProps) {
    const router = useRouter();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        const result = await deleteCategoryAction(categoryId);
        if (result.success) {
            toast.success('Category deleted successfully');
            router.refresh();
        } else {
            toast.error(result.error || 'Failed to delete category');
        }
        setShowConfirm(false);
    };

    return (
        <>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Link
                    href={`/admin/categories/${categoryId}`}
                    className="admin-btn admin-btn-outline"
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                >
                    Edit
                </Link>
                <button
                    onClick={() => setShowConfirm(true)}
                    className="admin-btn admin-btn-outline"
                    style={{ 
                        padding: '8px 16px', 
                        fontSize: '11px',
                        color: hasProducts ? '#999' : '#b91c1c',
                        borderColor: hasProducts ? '#ddd' : '#fecaca'
                    }}
                    disabled={hasProducts}
                    title={hasProducts ? 'Remove products first' : 'Delete category'}
                >
                    Delete
                </button>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowConfirm(false)}
            />
        </>
    );
}
