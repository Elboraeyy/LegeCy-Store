import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderPageClient from './OrderPageClient';

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

    // Serialize the order data for client component
    const serializedOrder = {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        totalPrice: Number(order.totalPrice),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
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
