import prisma from '@/lib/prisma';
import DailyOrdersClient from './DailyOrdersClient';

export const dynamic = 'force-dynamic';

interface Props {
    searchParams: Promise<{ 
        date?: string; 
        from?: string; 
        to?: string; 
        source?: string;
    }>;
}

export default async function DailyOrdersPage({ searchParams }: Props) {
    const params = await searchParams;
    
    // Default to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate: Date;
    let endDate: Date;
    
    if (params.from && params.to) {
        // Date range mode
        startDate = new Date(params.from);
        endDate = new Date(params.to);
        endDate.setHours(23, 59, 59, 999);
    } else if (params.date) {
        // Single date mode
        startDate = new Date(params.date);
        endDate = new Date(params.date);
        endDate.setHours(23, 59, 59, 999);
    } else {
        // Default to today
        startDate = today;
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
    }
    
    const sourceFilter = params.source || 'all';
    
    // Build where clause
    const where: Record<string, unknown> = {
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };
    
    if (sourceFilter !== 'all') {
        where.orderSource = sourceFilter;
    }
    
    // Fetch orders
    const orders = await prisma.order.findMany({
        where,
        include: {
            items: true,
            user: {
                select: { name: true, email: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    
    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalPrice), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // By status
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const paidCount = orders.filter(o => o.status === 'paid').length;
    const shippedCount = orders.filter(o => o.status === 'shipped').length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    
    // By source
    const sourceCounts: Record<string, { count: number; revenue: number }> = {};
    const sources = ['online', 'whatsapp', 'instagram', 'facebook', 'call', 'pos'];
    sources.forEach(s => {
        const sourceOrders = orders.filter(o => (o.orderSource || 'online') === s);
        sourceCounts[s] = {
            count: sourceOrders.length,
            revenue: sourceOrders.reduce((sum, o) => sum + Number(o.totalPrice), 0)
        };
    });
    
    // By payment method
    const paymentCounts: Record<string, number> = {};
    orders.forEach(o => {
        const method = o.paymentMethod || 'cod';
        paymentCounts[method] = (paymentCounts[method] || 0) + 1;
    });
    
    // Serialize orders for client
    const serializedOrders = orders.map(o => ({
        id: o.id,
        totalPrice: Number(o.totalPrice),
        status: o.status,
        orderSource: o.orderSource || 'online',
        paymentMethod: o.paymentMethod || 'cod',
        createdAt: o.createdAt.toISOString(),
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerEmail: o.customerEmail,
        shippingCity: o.shippingCity,
        itemCount: o.items.length,
        user: o.user ? { name: o.user.name, email: o.user.email } : null
    }));
    
    return (
        <DailyOrdersClient
            orders={serializedOrders}
            stats={{
                totalOrders,
                totalRevenue,
                avgOrderValue,
                pendingCount,
                paidCount,
                shippedCount,
                deliveredCount,
                cancelledCount,
                sourceCounts,
                paymentCounts
            }}
            currentDate={params.date || today.toISOString().split('T')[0]}
            dateRange={params.from && params.to ? { from: params.from, to: params.to } : null}
            currentSource={sourceFilter}
        />
    );
}
