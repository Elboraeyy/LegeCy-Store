import { Suspense } from 'react';
import { fetchOrderDetails } from '../../actions';
import '@/app/admin/admin.css';
import OrderDetailClient from './OrderDetailClient';

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <Suspense fallback={<div className="admin-card" style={{ textAlign: 'center', padding: '60px' }}>Loading Order Context...</div>}>
            <OrderDetailsServer id={id} />
        </Suspense>
    );
}

async function OrderDetailsServer({ id }: { id: string }) {
    const order = await fetchOrderDetails(id);

    if (!order) {
        return (
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px', color: '#cc0000' }}>
                Order Not Found
            </div>
        );
    }

    return <OrderDetailClient order={order} />;
}
