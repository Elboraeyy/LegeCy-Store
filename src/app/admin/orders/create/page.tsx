import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';
import CreateOrderClient from './CreateOrderClient';
import prisma from '@/lib/prisma';

// Fetch data needed for creating orders
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

// Transform Prisma result to match client interface
type ProductsResult = Awaited<ReturnType<typeof getOrderCreationData>>['products'];
type CustomersResult = Awaited<ReturnType<typeof getOrderCreationData>>['customers'];

function transformProducts(products: ProductsResult) {
    return products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.categoryRel ? { name: p.categoryRel.name } : null,
        variants: p.variants.map(v => ({
            id: v.id,
            sku: v.sku,
            name: v.sku, // Use SKU as display name
            price: Number(v.price), // Convert Decimal to number for client
            warehouseStock: v.inventory.map(inv => ({
                available: inv.available,
                warehouse: { id: inv.warehouse.id, name: inv.warehouse.name }
            }))
        }))
    }));
}

function transformCustomers(customers: CustomersResult) {
    return customers.map(c => ({
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
}

export default async function CreateOrderPage() {
    await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);

    const { products, customers } = await getOrderCreationData();

    return (
        <CreateOrderClient 
            products={transformProducts(products)} 
            customers={transformCustomers(customers)} 
        />
    );
}
