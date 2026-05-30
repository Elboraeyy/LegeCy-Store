import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import CreateOrderClient from '../../create/CreateOrderClient';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { OrderStatus } from '@/types/order';
import {
    getPrimaryVariantId,
    getPrimaryVariantNumber,
    getPrimaryVariantStock,
} from '@/lib/products/primary-variant';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getOrderCreationData() {
    const [products, customers] = await Promise.all([
        // Get active products with variants and stock
        prisma.product.findMany({
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
        }),
        // Get customers with addresses
        prisma.user.findMany({
            where: { 
                orders: { some: {} } 
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                addresses: {
                    take: 1,
                    orderBy: { isDefault: 'desc' }
                }
            },
            orderBy: { name: 'asc' },
            take: 100
        })
    ]);

    return { products, customers };
}

export default async function EditOrderPage({ params }: PageProps) {
    await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
    const { id } = await params;

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: true,
            user: true
        }
    });

    if (!order) {
        return notFound();
    }

    const { products, customers } = await getOrderCreationData();

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
        shippingAddress: order.shippingAddress,
        shippingCity: order.shippingCity,
        shippingGovernorate: order.shippingGovernorate,
        shippingNotes: order.shippingNotes,
        shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
        discountAmount: order.discountAmount ? Number(order.discountAmount) : 0,
        user: order.user ? {
            name: order.user.name,
            email: order.user.email
        } : undefined
    };

    // Transform Products
    const transformedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        defaultVariantId: getPrimaryVariantId(p.variants),
        sku: p.variants[0]?.sku || null,
        price: getPrimaryVariantNumber(p.variants, 'price'),
        stock: getPrimaryVariantStock(p.variants),
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

    // Transform Customers
    const transformedCustomers = customers.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        addresses: c.addresses.map(a => ({
            street: a.street,
            city: a.city,
            governorate: '',
            postalCode: null
        }))
    }));

    return (
        <CreateOrderClient 
            initialProducts={transformedProducts}
            initialCustomers={transformedCustomers} 
            initialOrder={initialOrder}
        />
    );
}
