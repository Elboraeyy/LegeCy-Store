"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMaterialAction, updateMaterialAction } from "@/lib/actions/material";
import { toast } from "sonner";
import Link from 'next/link';
import '@/app/admin/admin.css';

interface MaterialFormProps {
    initialData?: {
        id: string;
        name: string;
        slug: string;
    } | null;
}

export default function MaterialForm({ initialData }: MaterialFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(initialData?.name || "");
    const [slug, setSlug] = useState(initialData?.slug || "");

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
            };

            if (initialData) {
                await updateMaterialAction(initialData.id, payload);
                toast.success("Material updated successfully");
            } else {
                await createMaterialAction(payload);
                toast.success("Material created successfully");
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

    const title = initialData ? "Edit Material" : "Create Material";
    const action = initialData ? "Save Changes" : "Create Material";

    return (
        <form onSubmit={onSubmit}>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{title}</h1>
                    <p className="admin-subtitle">{initialData ? `Editing: ${initialData.name}` : 'Add a new strap material'}</p>
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
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Material Details</h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px' }}>Material Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Leather, Stainless Steel"
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
                            placeholder="e.g. leather"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            disabled={loading}
                            required
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
