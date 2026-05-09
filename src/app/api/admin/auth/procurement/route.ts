import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function GET(_request: NextRequest) {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                _count: { select: { invoices: true, products: true } }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({
            suppliers: suppliers.map(s => ({
                id: s.id,
                name: s.name,
                contactPerson: s.contactPerson,
                email: s.email,
                phone: s.phone,
                currency: s.currency,
                paymentTerms: s.paymentTerms,
                accountBalance: s.accountBalance.toNumber(),
                invoiceCount: s._count.invoices,
                productCount: s._count.products,
            }))
        });
    } catch (error) {
        console.error('Procurement GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, contactPerson, email, phone, currency, paymentTerms } = body;

        const supplier = await prisma.supplier.create({
            data: {
                name,
                contactPerson,
                email,
                phone,
                currency: currency || 'EGP',
                paymentTerms: paymentTerms || 'NET30',
                accountBalance: 0,
            }
        });

        return NextResponse.json({ supplier, message: 'Supplier created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Procurement POST Error:', error);
        return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }
}
