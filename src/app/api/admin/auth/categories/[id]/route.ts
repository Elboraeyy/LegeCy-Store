import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        
        const existing = await prisma.category.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        if (body.slug && body.slug !== existing.slug) {
            const conflict = await prisma.category.findUnique({ where: { slug: body.slug } });
            if (conflict) {
                return NextResponse.json({ error: 'Slug is already in use' }, { status: 400 });
            }
        }

        if (body.parentId === id) {
            return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
        }

        const dataToUpdate: any = {};
        if (body.name !== undefined) dataToUpdate.name = body.name;
        if (body.nameAr !== undefined) dataToUpdate.nameAr = body.nameAr;
        if (body.slug !== undefined) dataToUpdate.slug = body.slug;
        if (body.description !== undefined) dataToUpdate.description = body.description;
        if (body.descriptionAr !== undefined) dataToUpdate.descriptionAr = body.descriptionAr;
        if (body.parentId !== undefined) dataToUpdate.parentId = body.parentId;
        if (body.sortOrder !== undefined) dataToUpdate.sortOrder = Number(body.sortOrder);

        const category = await prisma.category.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json({ category, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Category Update Error:', error);
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        
        const existing = await prisma.category.findUnique({ 
            where: { id },
            include: {
                _count: { select: { products: true, children: true } }
            }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        if (existing._count.products > 0) {
            return NextResponse.json({ error: 'Cannot delete category that contains products' }, { status: 400 });
        }

        if (existing._count.children > 0) {
            return NextResponse.json({ error: 'Cannot delete category that has subcategories' }, { status: 400 });
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Category Delete Error:', error);
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
    }
}
