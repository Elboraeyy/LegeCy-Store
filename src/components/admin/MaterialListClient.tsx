'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { deleteMaterialAction } from '@/lib/actions/material';
import EmptyState from '@/components/admin/EmptyState';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';
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
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [materials, setMaterials] = useState(initialMaterials);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${t.materials.confirm_delete} "${name}"?`)) return;

        setLoading(true);
        try {
            const result = await deleteMaterialAction(id);
            if (result.success) {
                toast.success(t.materials.deleted);
                setMaterials(prev => prev.filter(m => m.id !== id));
                router.refresh();
            } else {
                toast.error(result.error || t.materials.failed_delete);
            }
        } catch (error) {
            console.error(error);
            toast.error(t.materials.error);
        } finally {
            setLoading(false);
        }
    };

    if (materials.length === 0) {
        return (
            <EmptyState
                icon="🧱"
                title={t.materials.no_materials}
                description={t.materials.empty_desc}
                actionLabel={t.materials.add_material}
                actionHref="/admin/materials/new"
            />
        );
    }

    return (
        <div>
            {/* Header / Toolbar */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{t.materials.title}</h1>
                    <p className="admin-subtitle">{t.materials.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Link href="/admin/materials/new" className="admin-btn admin-btn-primary">
                        + {t.materials.add_material}
                    </Link>
                </div>
            </div>

            {/* Materials Table */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>{t.materials.name}</th>
                            <th>{t.materials.slug}</th>
                            <th>{t.materials.products}</th>
                            <th style={{ textAlign: 'right' }}>{t.materials.actions}</th>
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
                                            {t.materials.edit}
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
                                            title={material._count.products > 0 ? t.materials.remove_products_first : t.materials.delete_material}
                                        >
                                            {t.materials.delete}
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
