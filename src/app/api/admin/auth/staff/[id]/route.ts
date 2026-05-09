import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, email, username, password, roleId, position, phone, isActive } = body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (username) updateData.username = username;
        if (roleId) updateData.roleId = roleId;
        if (position !== undefined) updateData.position = position;
        if (phone !== undefined) updateData.phone = phone;
        if (isActive !== undefined) updateData.isActive = isActive;

        if (password) {
            const policy = validatePasswordStrength(password);
            if (!policy.isValid) {
                return NextResponse.json({ error: policy.issues[0] }, { status: 400 });
            }
            updateData.passwordHash = await hashPassword(password);
        }

        const updated = await prisma.adminUser.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            message: 'Staff member updated successfully',
            staff: updated
        });
    } catch (error) {
        console.error('Staff PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Prevent deleting the last admin or yourself? 
        // For simplicity, we just delete. But we should check if the user exists.
        
        await prisma.adminUser.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Staff DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
    }
}
