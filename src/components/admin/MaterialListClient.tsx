'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteMaterialAction } from '@/lib/actions/material';
import EmptyState from '@/components/admin/EmptyState';
import { useRouter } from 'next/navigation';
import '@/app/admin/admin.css';

interface Material {
    id: string;
    name: string;
    slug: string;
    _count: {
        products: number;
    };
}

export default function MaterialListClient({ initialMaterials }: { initialMaterials: Material[] }) {
    const [materials, setMaterials] = useState(initialMaterials);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete material "${name}"?`)) return;

        setLoading(true);
        try {
            const result = await deleteMaterialAction(id);
            if (result.success) {
                toast.success('Material deleted successfully');
                setMaterials(prev => prev.filter(m => m.id !== id));
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to delete material');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (materials.length === 0) {
        return (
            <EmptyState
                icon="🧱"
                title="No materials yet"
                description="Define materials (e.g. Leather, Steel) for your products"
                actionLabel="Create Material"
                actionHref="/admin/materials/new"
            />
        );
    }

    return (
        <div>
            {/* Header / Toolbar */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Strap Materials</h1>
                    <p className="admin-subtitle">Manage product materials</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link href="/admin/materials/new" className="admin-btn admin-btn-primary">
                        + Add Material
                    </Link>
                </div>
            </div>

            {/* Materials Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Products</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materials.map((material) => (
                            <tr key={material.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--admin-text-on-light)' }}>
                                        {material.name}
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--admin-text-muted)' }}>
                                        {material.slug}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        background: material._count.products > 0 ? 'rgba(22, 101, 52, 0.1)' : '#f0f0f0', 
                                        fontSize: '12px', 
                                        fontWeight: 600,
                                        color: material._count.products > 0 ? '#166534' : '#999'
                                    }}>
                                        {material._count.products}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <Link 
                                            href={`/admin/materials/${material.id}`} 
                                            className="admin-btn admin-btn-outline"
                                            style={{ padding: '8px 16px', fontSize: '11px' }}
                                        >
                                            Edit
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(material.id, material.name)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ 
                                                padding: '8px 16px', 
                                                fontSize: '11px',
                                                color: material._count.products > 0 ? '#999' : '#b91c1c',
                                                borderColor: material._count.products > 0 ? '#ddd' : '#fecaca'
                                            }}
                                            disabled={loading || material._count.products > 0}
                                            title={material._count.products > 0 ? 'Remove products first' : 'Delete material'}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
