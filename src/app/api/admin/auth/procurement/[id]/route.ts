import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        
        const updated = await prisma.supplier.update({
            where: { id },
            data: {
                name: body.name,
                contactPerson: body.contactPerson,
                email: body.email,
                phone: body.phone,
                paymentTerms: body.paymentTerms,
            },
        });

        return NextResponse.json({ message: 'Supplier updated successfully', supplier: updated });
    } catch (error) {
        console.error('Update Supplier Error:', error);
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // We shouldn't delete if they have invoices/products linked, but for simplicity we'll try to delete.
        // Prisma will throw if there are strict foreign keys.
        await prisma.supplier.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Delete Supplier Error:', error);
        return NextResponse.json({ error: 'Failed to delete supplier, it may have linked data' }, { status: 500 });
    }
}
