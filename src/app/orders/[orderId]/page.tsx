import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderPageClient from './OrderPageClient';
import { requireAuth } from '@/lib/auth/guards';

interface Props {
    params: Promise<{ orderId: string }>;
}

export default async function OrderTrackingPage({ params }: Props) {
    const { orderId } = await params;
    
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true
        }
    });
    
    if (!order) {
        notFound();
    }

    const user = await requireAuth();
    
    // Security check: Ensure the order belongs to the logged-in user
    const isOwner = order.userId === user.id || (!order.userId && order.customerEmail === user.email);
    if (!isOwner) {
        // 404 is safer to not leak order existence.
        notFound();
    }

    // Serialize the order data for client component
    const serializedOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        totalPrice: Number(order.totalPrice),
        shippingCost: Number(order.shippingCost),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        shippingGovernorate: order.shippingGovernorate,
        shippingCity: order.shippingCity,
        paymentMethod: order.paymentMethod,
        items: order.items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: Number(item.price)
        }))
    };

    return <OrderPageClient order={serializedOrder} orderId={orderId} />;
}
