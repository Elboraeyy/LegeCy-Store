import { validateAdminSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { fetchAllReviews } from '@/lib/actions/reviews';
import prisma from '@/lib/prisma';
import ReviewsClient from './ReviewsClient';

export default async function AdminReviewsPage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');

    const reviews = await fetchAllReviews();
    
    // Fetch products for the dropdown
    const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
    });

    const stats = {
        total: reviews.length,
        featured: reviews.filter(r => r.featured).length,
        avgRating: reviews.length > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
            : '0'
    };

    return (
        <div>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Reviews Management</h1>
                    <p className="admin-subtitle">Manage customer reviews and testimonials</p>
                </div>
            </div>

            {/* Stats */}
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <div className="admin-card">
                    <div className="stat-label">Total Reviews</div>
                    <div className="stat-value">{stats.total}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">Featured</div>
                    <div className="stat-value">{stats.featured}</div>
                </div>
                <div className="admin-card">
                    <div className="stat-label">Avg Rating</div>
                    <div className="stat-value">⭐ {stats.avgRating}</div>
                </div>
            </div>

            {/* Client Component for interactivity */}
            <ReviewsClient reviews={reviews} products={products} />
        </div>
    );
}
