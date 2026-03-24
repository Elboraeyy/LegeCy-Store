import { requireAuth } from '@/lib/auth/guards';
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { OrderStatus } from '@/types/order';
import CustomerEditOrderClient from './CustomerEditOrderClient';

interface PageProps {
    params: Promise<{ orderId: string }>;
}

async function getOrderCreationData() {
    // Get active products with variants and stock for search
    const products = await prisma.product.findMany({
        where: { status: 'active' },
        include: {
            variants: {
                include: {
                    inventory: {
                        where: { available: { gt: 0 } },
                        include: { warehouse: true }
                    }
                }
            },
            categoryRel: true
        },
        orderBy: { name: 'asc' }
    });

    return { products };
}

export default async function CustomerEditOrderPage({ params }: PageProps) {
    const user = await requireAuth();
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
            user: true
        }
    });

    if (!order) {
        return notFound();
    }

    // Security check: Ensure the order belongs to the logged-in user
    const isOwner = order.userId === user.id || (!order.userId && order.customerEmail === user.email);
    if (!isOwner) {
        // If not the owner, redirect or 404. 
        // 404 is safer to not leak order existence.
        return notFound();
    }

    // Check if order is editable
    const editableStatuses = ['pending', 'payment_pending', 'draft'];
    if (!editableStatuses.includes(order.status.toLowerCase())) {
        redirect(`/orders/${orderId}`);
    }

    const { products } = await getOrderCreationData();

    // Transform Order to match Client Interface
    const initialOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        totalPrice: Number(order.totalPrice),
        status: order.status as OrderStatus,
        createdAt: order.createdAt.toISOString(),
        paymentMethod: order.paymentMethod,
        orderSource: order.orderSource,
        items: order.items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            variantId: item.variantId
        })),
        firstName: order.firstName,
        lastName: order.lastName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        alternativePhone: order.alternativePhone,
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingGovernorate: order.shippingGovernorate,
        shippingNotes: order.shippingNotes,
        shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
    };

    // Transform Products
    const transformedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.categoryRel ? { name: p.categoryRel.name } : null,
        variants: p.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            name: v.sku,
            price: Number(v.price),
            warehouseStock: v.inventory.map(inv => ({
                available: inv.available,
                warehouse: { id: inv.warehouse.id, name: inv.warehouse.name }
            }))
        }))
    }));

    return (
        <CustomerEditOrderClient
            initialProducts={transformedProducts}
            initialOrder={initialOrder}
            currentUser={{
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            }}
        />
    );
}
