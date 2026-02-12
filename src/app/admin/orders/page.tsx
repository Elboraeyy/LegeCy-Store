import { fetchAdminOrders, fetchOrderStats } from '../actions';
import { OrderStatus } from '@/lib/orderStatus';
import OrdersClient from './OrdersClient';

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1;
    const status = typeof resolvedParams.status === 'string' ? (resolvedParams.status as OrderStatus) : undefined;
    const viewValue = typeof resolvedParams.view === 'string' ? resolvedParams.view : undefined;
    const view = (viewValue === 'all' || viewValue === 'issues' || viewValue === 'returns') ? viewValue : undefined;
    const search = typeof resolvedParams.search === 'string' ? resolvedParams.search : undefined;

    // Fetch data in parallel
    const [ordersResult, stats] = await Promise.all([
        fetchAdminOrders({ page, status, view, search, limit: 100 }), // Fetch more for board view
        fetchOrderStats()
    ]);

    const { data: orders } = ordersResult;

    // Transform orders to match client interface if necessary, 
    // but assuming actions return compatible types or we cast.
    // The action returns Decimal, but Client expects number.
    // fetchAdminOrders calls getOrders from service.
    // We might need to ensure serialization protocols (Next.js passes server->client via JSON).
    // Prisma Decimals need to be converted to numbers or strings. 
    // `getOrders` usually returns POJOs if optimized, but let's check.
    // Actually, `getOrders` in `orderService` likely returns Prisma objects with Decimals.
    // providing a transform here is safer.
    
    const serializedOrders = orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalPrice: Number(order.totalPrice),
        createdAt: order.createdAt,
        status: order.status as OrderStatus,
        paymentMethod: order.paymentMethod,
        orderSource: order.orderSource,
        user: order.user ? { name: order.user.name, email: order.user.email } : undefined,
        riskScore: (order as { riskScore?: number }).riskScore,
        hasDispute: (order as { hasDispute?: boolean }).hasDispute,
        items: [] 
    }));

    return (
        <OrdersClient 
            initialOrders={serializedOrders} 
            stats={stats}
        />
    );
}
