import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
const prisma = prismaClient!;

export async function GET(_req: NextRequest) {
    try {
        const invoices = await prisma.purchaseInvoice.findMany({
            orderBy: { createdAt: 'desc' },
            include: { supplier: true }
        });

        return NextResponse.json({
            invoices: invoices.map(inv => ({
                ...inv,
                subtotal: Number(inv.subtotal),
                taxTotal: Number(inv.taxTotal),
                shippingTotal: Number(inv.shippingTotal),
                discountTotal: Number(inv.discountTotal),
                grandTotal: Number(inv.grandTotal),
                paidAmount: Number(inv.paidAmount),
                remainingAmount: Number(inv.remainingAmount),
                exchangeRate: Number(inv.exchangeRate),
            }))
        });
    } catch (error) {
        console.error('Purchase Invoices GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            invoiceNumber, 
            supplierId, 
            issueDate, 
            status, 
            paymentStatus, 
            grandTotal, 
            notes 
        } = body;

        if (!invoiceNumber || !supplierId || !issueDate) {
            return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
        }

        const invoice = await prisma.purchaseInvoice.create({
            data: {
                invoiceNumber,
                supplierId,
                issueDate: new Date(issueDate),
                status: status || 'DRAFT',
                paymentStatus: paymentStatus || 'UNPAID',
                subtotal: Number(grandTotal), // Simplified for quick entry
                taxTotal: 0,
                shippingTotal: 0,
                discountTotal: 0,
                grandTotal: Number(grandTotal),
                remainingAmount: Number(grandTotal),
                notes,
            },
            include: { supplier: true }
        });

        return NextResponse.json({ invoice, message: 'Invoice created successfully' });
    } catch (error) {
        console.error('Purchase Invoice POST Error:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
