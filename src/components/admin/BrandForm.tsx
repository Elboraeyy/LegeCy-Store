"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrandAction, updateBrandAction } from "@/lib/actions/brand";
import { toast } from "sonner";
import Link from 'next/link';
import ImageUpload from "@/components/admin/ImageUpload";
import '@/app/admin/admin.css';

interface BrandFormProps {
    initialData?: {
        id: string;
        name: string;
        slug: string;
        imageUrl: string | null;
    } | null;
}

export default function BrandForm({ initialData }: BrandFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(initialData?.name || "");
    const [slug, setSlug] = useState(initialData?.slug || "");
    const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || "");

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
                imageUrl: imageUrl || undefined,
            };

            if (initialData) {
                await updateBrandAction(initialData.id, payload);
                toast.success("Brand updated successfully");
            } else {
                await createBrandAction(payload);
                toast.success("Brand created successfully");
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

    const title = initialData ? "Edit Brand" : "Create Brand";
    const action = initialData ? "Save Changes" : "Create Brand";

    return (
        <form onSubmit={onSubmit}>
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">{title}</h1>
                    <p className="admin-subtitle">{initialData ? `Editing: ${initialData.name}` : 'Add a new brand'}</p>
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
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Brand Details</h3>

                    <div className="admin-form-group">
                        <label className="stat-label" style={{ fontSize: '11px' }}>Brand Name</label>
                        <input
                            className="form-input"
                            placeholder="e.g. Rolex"
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
                            placeholder="e.g. rolex"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            disabled={loading}
                            required
                            style={{ fontFamily: 'monospace' }}
                        />
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>Logo</h3>
                    
                    <div className="admin-form-group">
                        <ImageUpload 
                            value={imageUrl ? [imageUrl] : []}
                            disabled={loading}
                            onChange={(url) => setImageUrl(url)}
                            onRemove={() => setImageUrl("")}
                        />
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)', marginTop: '8px' }}>
                            Upload the brand logo (optional)
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
