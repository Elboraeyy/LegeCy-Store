"use server";

import prisma from "@/lib/prisma";

export async function searchSuppliers(query: string) {
    const suppliers = await prisma.supplier.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' }
        },
        take: 10,
        select: { id: true, name: true }
    });
    return suppliers;
}

export async function createQuickSupplier(name: string) {
    const supplier = await prisma.supplier.create({
        data: { name }
    });
    return { id: supplier.id, name: supplier.name };
}
