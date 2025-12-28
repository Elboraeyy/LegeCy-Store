"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction, fetchAllCategories } from "@/lib/actions/category";
import { toast } from "sonner";
import Link from 'next/link';
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';

interface CategoryFormProps {
    initialData?: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        parentId: string | null;
        sortOrder: number;
    } | null;
}

export default function CategoryForm({ initialData }: CategoryFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string; sortOrder: number }[]>([]);

    const [name, setName] = useState(initialData?.name || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [parentId, setParentId] = useState(initialData?.parentId || "");
    const [sortOrder, setSortOrder] = useState(initialData?.sortOrder?.toString() || "0");

    useEffect(() => {
        fetchAllCategories().then(cats => {
            // Filter out current category to prevent self-reference
            setCategories(cats.filter(c => c.id !== initialData?.id).map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder })));
        });
    }, [initialData?.id]);

    // Auto-generate slug from name
    const handleNameChange = (value: string) => {
        setName(value);
        if (!initialData) {
            setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name,
                slug,
                description: description || undefined,
                parentId: parentId || undefined,
                sortOrder: parseInt(sortOrder) || 0
            };

            if (initialData) {
                await updateCategoryAction(initialData.id, payload);
                toast.success("Category updated successfully");
            } else {
                await createCategoryAction(payload);
                toast.success("Category created successfully");
            }

            router.push('/admin/categories');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const title = initialData ? "Edit Category" : "Create Category";
    const action = initialData ? "Save Changes" : "Create Category";

    return (
        <form onSubmit={onSubmit}>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{title}</h1>
                    <p className="admin-subtitle">{initialData ? `Editing: ${initialData.name}` : 'Add a new product category'}</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href="/admin/categories" className="admin-btn admin-btn-outline">
                        Cancel
                    </Link>
                    <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                        {loading ? "Saving..." : action}
                    </button>
                </div>
            </div>

            <div className="admin-grid" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Category Details</h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px' }}>Category Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Luxury Watches"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '16px' }}>
                        <label className="stat-label" style={{ fontSize: '11px' }}>URL Slug</label>
                        <input
                            className="form-input"
                            placeholder="e.g. luxury-watches"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            disabled={loading}
                            required
                            style={{ fontFamily: 'monospace' }}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                            Used in URLs: /shop/category/{slug || 'slug'}
                        </div>
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '16px' }}>
                        <label className="stat-label" style={{ fontSize: '11px' }}>Description</label>
                        <textarea
                            className="form-input"
                            placeholder="Optional description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Organization</h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px' }}>Parent Category</label>
                        <AdminDropdown
                            value={parentId}
                            onChange={setParentId}
                            disabled={loading}
                            options={[
                                { value: '', label: 'None (Top Level)' },
                                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                            ]}
                        />
                    </div>

                    <div className="admin-form-group" style={{ marginTop: '16px' }}>
                        <label className="stat-label" style={{ fontSize: '11px' }}>Sort Order</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="0"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            disabled={loading}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>
                            Lower numbers appear first
                        </div>
                    </div>

                    {/* Reference List */}
                    <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                         <h4 className="stat-label" style={{ fontSize: '12px', marginBottom: '12px', color: 'var(--admin-text-muted)' }}>Reference: Existing Categories</h4>
                         <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                            {categories.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {categories
                                        .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0))
                                        .map(cat => (
                                            <div key={cat.id} style={{ 
                                                fontSize: '12px', 
                                                padding: '8px', 
                                                background: '#f8f8f8', 
                                                borderRadius: '6px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>{cat.name}</span>
                                                <span style={{ 
                                                    fontFamily: 'monospace', 
                                                    background: '#fff', 
                                                    padding: '2px 6px', 
                                                    borderRadius: '4px',
                                                    border: '1px solid #eee',
                                                    color: 'var(--admin-text-muted)'
                                                }}>{cat.sortOrder}</span>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>No categories yet</div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
