import { fetchFailedPaymentOrders } from './actions';
import FailedPaymentsClient from './FailedPaymentsClient';
import BackButton from '@/components/admin/BackButton';

export default async function FailedPaymentsPage() {
    const orders = await fetchFailedPaymentOrders();

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header - Same style as Orders page */}
            <div className="admin-header">
                <div>
                    <h1 className="admin-title">Failed Payments</h1>
                    <p className="admin-subtitle">Orders with failed payment attempts. Contact customers to complete orders.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <BackButton fallbackHref="/admin/orders" label="← Back" />
                </div>
            </div>

            <FailedPaymentsClient orders={orders} />
        </div>
    );
}
