'use server';

import prisma from '@/lib/prisma';
// import { getGuestOrder } from './order'; // Removed unused import

// ------------------------------------------------------
// INVOICE DOWNLOAD (HTML Generation)
// ------------------------------------------------------
export async function getInvoiceHtml(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    });

    if (!order) return null;

    // Basic Invoice HTML Template
    return `
        <html>
        <head><title>Invoice #${order.id.slice(0, 8)}</title></head>
        <body style="font-family: sans-serif; padding: 40px;">
            <h1>INVOICE</h1>
            <p>Order ID: ${order.id}</p>
            <p>Date: ${order.createdAt.toLocaleDateString()}</p>
            <p>Customer: ${order.customerName}</p>
            <hr />
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="text-align: left;"><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>${Number(item.price).toFixed(2)}</td>
                            <td>${(Number(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr />
            <h3 style="text-align: right;">Total: EGP ${Number(order.totalPrice).toFixed(2)}</h3>
        </body>
        </html>
    `;
}

// ------------------------------------------------------
// ORDER TRACKING
// ------------------------------------------------------
export async function getTrackingInfo(orderId: string) {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { 
            id: true, 
            status: true, 
            updatedAt: true,
            shippingProvider: true,
            trackingNumber: true,
            // Assuming we might have estimated delivery
        }
    });
    
    if (!order) return null;

    return {
        status: order.status,
        lastUpdate: order.updatedAt,
        provider: order.shippingProvider,
        trackingNumber: order.trackingNumber
    };
}

// ------------------------------------------------------
// RETURN STATUS
// ------------------------------------------------------
export async function getReturnStatus(orderId: string) {
    const dispute = await prisma.orderDispute.findFirst({
        where: { orderId: orderId, type: 'refund_request' },
        orderBy: { createdAt: 'desc' }
    });

    if (!dispute) return { status: 'No Return Request', details: null };

    return {
        status: dispute.status,
        requestDate: dispute.createdAt,
        resolution: dispute.resolution
    };
}
