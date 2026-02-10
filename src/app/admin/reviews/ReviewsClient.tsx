'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { 
    createReviewAction, 
    deleteReviewAction, 
    toggleReviewFeaturedAction,
    ReviewDTO 
} from '@/lib/actions/reviews';
import '@/app/admin/admin.css';
import AdminDropdown from '@/components/admin/ui/AdminDropdown';
import { useLanguage } from '@/context/LanguageContext';
import { adminDictionary } from '@/lib/dictionaries/admin';

interface ReviewsClientProps {
    reviews: ReviewDTO[];
    products: { id: string; name: string }[];
}

export default function ReviewsClient({ reviews: initialReviews, products }: ReviewsClientProps) {
    const { language } = useLanguage();
    const t = adminDictionary[language as keyof typeof adminDictionary];
    const [reviews, setReviews] = useState(initialReviews);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [productId, setProductId] = useState('');
    const [featured, setFeatured] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createReviewAction({
                name,
                rating,
                text,
                productId: productId || undefined,
                featured
            });
            toast.success(t.reviews.created || 'Review created successfully!');
            setShowForm(false);
            // Reset form
            setName('');
            setRating(5);
            setText('');
            setProductId('');
            setFeatured(true);
            // Refresh page to get new data
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error(t.reviews.failed_create || 'Failed to create review');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t.reviews.confirm_delete || 'Are you sure you want to delete this review?')) return;
        
        const result = await deleteReviewAction(id);
        if (result.success) {
            setReviews(prev => prev.filter(r => r.id !== id));
            toast.success(t.reviews.deleted || 'Review deleted');
        } else {
            toast.error(result.error || t.reviews.failed_delete || 'Failed to delete');
        }
    };

    const handleToggleFeatured = async (id: string) => {
        try {
            await toggleReviewFeaturedAction(id);
            setReviews(prev => prev.map(r => 
                r.id === id ? { ...r, featured: !r.featured } : r
            ));
            toast.success(t.reviews.feature_updated || 'Feature status updated');
        } catch {
            toast.error(t.reviews.failed_update || 'Failed to update');
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div>
            {/* Add Button */}
            <div style={{ marginBottom: '24px' }}>
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className="admin-btn admin-btn-primary"
                >
                    {showForm ? (t.common?.cancel || 'Cancel') : `+ ${t.reviews.add_review || 'Add Review'}`}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="admin-card" style={{ marginBottom: '24px' }}>
                    <h3 className="stat-label" style={{ marginBottom: '20px' }}>{t.reviews.add_new_review || 'Add New Review'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>{t.reviews.reviewer_name || 'Reviewer Name'}</label>
                                <input
                                    className="form-input"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={t.reviews.customer_name_placeholder || 'Customer name'}
                                    required
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>{t.reviews.rating_label || 'Rating'}</label>
                                <AdminDropdown
                                    value={String(rating)}
                                    onChange={(val) => setRating(Number(val))}
                                    options={[
                                        { value: '5', label: '⭐⭐⭐⭐⭐ (5)' },
                                        { value: '4', label: '⭐⭐⭐⭐ (4)' },
                                        { value: '3', label: '⭐⭐⭐ (3)' },
                                        { value: '2', label: '⭐⭐ (2)' },
                                        { value: '1', label: '⭐ (1)' },
                                    ]}
                                />
                            </div>
                        </div>
                        
                        <div className="admin-form-group" style={{ marginTop: '16px' }}>
                            <label className="stat-label" style={{ fontSize: '11px' }}>{t.reviews.review_text || 'Review Text'}</label>
                            <textarea
                                className="form-input"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder={t.reviews.write_review_placeholder || 'Write the review...'}
                                rows={3}
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>{t.reviews.product_optional || 'Product (Optional)'}</label>
                                <AdminDropdown
                                    value={productId}
                                    onChange={setProductId}
                                    options={[
                                        { value: '', label: t.reviews.general_review || 'General Review' },
                                        ...products.map(p => ({ value: p.id, label: p.name }))
                                    ]}
                                />
                            </div>
                            <div className="admin-form-group">
                                <label className="stat-label" style={{ fontSize: '11px' }}>{t.reviews.featured_label || 'Featured'}</label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={featured}
                                        onChange={e => setFeatured(e.target.checked)}
                                        style={{ width: '18px', height: '18px' }}
                                    />
                                    <span>{t.reviews.show_on_product || 'Show on product pages'}</span>
                                </label>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary">
                                {loading ? (t.reviews.creating || 'Creating...') : (t.reviews.create_review || 'Create Review')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Reviews Table */}
            {reviews.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>{t.reviews.reviewer || 'Reviewer'}</th>
                                <th>{t.reviews.rating_label || 'Rating'}</th>
                                <th>{t.reviews.review || 'Review'}</th>
                                <th>{t.reviews.product || 'Product'}</th>
                                <th>{t.reviews.featured_label || 'Featured'}</th>
                                <th>{t.reviews.date || 'Date'}</th>
                                <th style={{ textAlign: 'right' }}>{t.reviews.actions || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map(review => (
                                <tr key={review.id}>
                                    <td style={{ fontWeight: 600 }}>{review.name}</td>
                                    <td>{'⭐'.repeat(review.rating)}</td>
                                    <td style={{ maxWidth: '300px' }}>
                                        <div style={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap' 
                                        }}>
                                            {review.text}
                                        </div>
                                    </td>
                                    <td>
                                        {review.productName || (
                                            <span style={{ color: 'var(--admin-text-muted)' }}>{t.reviews.general || 'General'}</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleToggleFeatured(review.id)}
                                            style={{
                                                background: review.featured ? 'rgba(22, 101, 52, 0.1)' : 'rgba(0,0,0,0.05)',
                                                color: review.featured ? '#166534' : 'var(--admin-text-muted)',
                                                border: 'none',
                                                padding: '4px 12px',
                                                borderRadius: '99px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {review.featured ? (t.reviews.is_featured || '✓ Featured') : (t.reviews.not_featured || 'Not Featured')}
                                        </button>
                                    </td>
                                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                                        {formatDate(review.createdAt)}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            className="admin-btn admin-btn-outline"
                                            style={{ 
                                                padding: '6px 12px', 
                                                fontSize: '11px',
                                                color: '#991b1b',
                                                borderColor: '#991b1b'
                                            }}
                                        >
                                            {t.reviews.delete || 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="admin-card" style={{ textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <h3 style={{ marginBottom: '8px' }}>{t.reviews.no_reviews}</h3>
                    <p style={{ color: 'var(--admin-text-muted)' }}>
                            {t.reviews.empty_desc || 'Add your first review to display on product pages.'}
                    </p>
                </div>
            )}
        </div>
    );
}
