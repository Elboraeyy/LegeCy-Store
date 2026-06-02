import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
const prisma = prismaClient!;

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const invoice = await prisma.purchaseInvoice.findUnique({
            where: { id },
            include: { 
                supplier: true,
                items: {
                    include: {
                        product: true,
                        variant: true
                    }
                },
                payments: true
            }
        });

        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        return NextResponse.json({
            invoice: {
                ...invoice,
                subtotal: Number(invoice.subtotal),
                taxTotal: Number(invoice.taxTotal),
                shippingTotal: Number(invoice.shippingTotal),
                discountTotal: Number(invoice.discountTotal),
                grandTotal: Number(invoice.grandTotal),
                paidAmount: Number(invoice.paidAmount),
                remainingAmount: Number(invoice.remainingAmount),
                exchangeRate: Number(invoice.exchangeRate),
                items: invoice.items.map(item => ({
                    ...item,
                    unitCost: Number(item.unitCost),
                    finalUnitCost: Number(item.finalUnitCost),
                    totalCost: Number(item.totalCost),
                })),
                payments: invoice.payments.map(p => ({
                    ...p,
                    amount: Number(p.amount)
                }))
            }
        });
    } catch (error) {
        console.error('Purchase Invoice GET ID Error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const data: Record<string, string | number> = {};
        if (body.status !== undefined) data.status = body.status;
        if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus;
        if (body.paidAmount !== undefined) {
            data.paidAmount = Number(body.paidAmount);
            // Re-calculate remaining amount if total is known
            const inv = await prisma.purchaseInvoice.findUnique({ where: { id } });
            if (inv) {
                data.remainingAmount = Number(inv.grandTotal) - data.paidAmount;
            }
        }
        if (body.notes !== undefined) data.notes = body.notes;

        const invoice = await prisma.purchaseInvoice.update({
            where: { id },
            data,
            include: { supplier: true }
        });

        return NextResponse.json({ invoice, message: 'Invoice updated successfully' });
    } catch (error) {
        console.error('Purchase Invoice PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.purchaseInvoice.delete({ where: { id } });
        return NextResponse.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Purchase Invoice DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
}
