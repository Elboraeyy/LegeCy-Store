import { fetchFailedPaymentOrders } from './actions';
import FailedPaymentsClient from './FailedPaymentsClient';

export default async function FailedPaymentsPage() {
    const orders = await fetchFailedPaymentOrders();

    return (
        <div style={{ paddingBottom: '40px' }}>
            <FailedPaymentsClient orders={orders} />
        </div>
    );
}
