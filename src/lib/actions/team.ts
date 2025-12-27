'use server';

import prisma from '@/lib/prisma';
import { hasPermission, AdminPermissions } from '@/lib/auth/permissions';
import { validateAdminSession } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Helper to check if user can view team (READ permission)
async function requireTeamRead() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');
    // Owner and super_admin can always view, others need TEAM_READ
    if (user.role?.name === 'owner' || user.role?.name === 'super_admin') return user;
    if (!hasPermission(user.role, AdminPermissions.TEAM.READ)) {
        throw new Error('Permission denied');
    }
    return user;
}

// Helper to check if user can manage team (add/edit - requires owner)
async function requireTeamManage() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');
    // Only owner can manage team
    if (user.role?.name !== 'owner') {
        throw new Error('Only owner can manage team members');
    }
    return user;
}

// Helper to check if user can delete team members (requires owner)
async function requireTeamDelete() {
    const { user } = await validateAdminSession();
    if (!user) redirect('/admin/login');
    // Only owner can delete team members
    if (user.role?.name !== 'owner') {
        throw new Error('Only owner can delete team members');
    }
    return user;
}

export interface TeamMemberData {
    id?: string;
    email: string;
    password?: string;
    name: string;
    username?: string;
    phone?: string;
    nationalId?: string;
    idCardImage?: string;
    avatar?: string;
    birthDate?: string;
    address?: string;
    emergencyContact?: string;
    position?: string;
    salary?: number;
    hireDate?: string;
    notes?: string;
    roleId?: string;
    isActive?: boolean;
}

export interface TeamMember {
    id: string;
    email: string;
    name: string;
    username: string | null;
    phone: string | null;
    nationalId: string | null;
    idCardImage: string | null;
    avatar: string | null;
    birthDate: Date | null;
    address: string | null;
    emergencyContact: string | null;
    position: string | null;
    salary: number | null;
    hireDate: Date | null;
    notes: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    role: {
        id: string;
        name: string;
    } | null;
}

// Get all team members
export async function getTeamMembers(): Promise<TeamMember[]> {
    await requireTeamRead();

    const members = await prisma.adminUser.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,
            name: true,
            username: true,
            phone: true,
            nationalId: true,
            idCardImage: true,
            avatar: true,
            birthDate: true,
            address: true,
            emergencyContact: true,
            position: true,
            salary: true,
            hireDate: true,
            notes: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            role: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    return members.map(m => ({
        ...m,
        salary: m.salary ? Number(m.salary) : null
    }));
}

// Get single team member
export async function getTeamMember(id: string): Promise<TeamMember | null> {
    await requireTeamRead();

    const member = await prisma.adminUser.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            username: true,
            phone: true,
            nationalId: true,
            idCardImage: true,
            avatar: true,
            birthDate: true,
            address: true,
            emergencyContact: true,
            position: true,
            salary: true,
            hireDate: true,
            notes: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            role: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    if (!member) return null;

    return {
        ...member,
        salary: member.salary ? Number(member.salary) : null
    };
}

// Create new team member
export async function createTeamMember(data: TeamMemberData): Promise<{ success: boolean; error?: string; id?: string }> {
    await requireTeamManage();

    try {
        // Check if email already exists
        const existing = await prisma.adminUser.findUnique({
            where: { email: data.email }
        });

        if (existing) {
            return { success: false, error: 'Email already exists' };
        }

        // Check if nationalId already exists (if provided)
        if (data.nationalId) {
            const existingNationalId = await prisma.adminUser.findUnique({
                where: { nationalId: data.nationalId }
            });
            if (existingNationalId) {
                return { success: false, error: 'National ID already exists' };
            }
        }

        // Hash password
        if (!data.password) {
            return { success: false, error: 'Password is required' };
        }
        const passwordHash = await hashPassword(data.password);

        const member = await prisma.adminUser.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                username: data.username || null,
                phone: data.phone || null,
                nationalId: data.nationalId || null,
                idCardImage: data.idCardImage || null,
                avatar: data.avatar || null,
                birthDate: data.birthDate ? new Date(data.birthDate) : null,
                address: data.address || null,
                emergencyContact: data.emergencyContact || null,
                position: data.position || null,
                salary: data.salary || null,
                hireDate: data.hireDate ? new Date(data.hireDate) : null,
                notes: data.notes || null,
                roleId: data.roleId || null,
                isActive: data.isActive ?? true
            }
        });

        revalidatePath('/admin/team');
        return { success: true, id: member.id };
    } catch (error) {
        console.error('Error creating team member:', error);
        return { success: false, error: 'Failed to create team member' };
    }
}

// Update team member
export async function updateTeamMember(id: string, data: Partial<TeamMemberData>): Promise<{ success: boolean; error?: string }> {
    await requireTeamManage();

    try {
        // Check if email is being changed and already exists
        if (data.email) {
            const existing = await prisma.adminUser.findFirst({
                where: { email: data.email, NOT: { id } }
            });
            if (existing) {
                return { success: false, error: 'Email already exists' };
            }
        }

        // Check if nationalId is being changed and already exists
        if (data.nationalId) {
            const existing = await prisma.adminUser.findFirst({
                where: { nationalId: data.nationalId, NOT: { id } }
            });
            if (existing) {
                return { success: false, error: 'National ID already exists' };
            }
        }

        const updateData: Record<string, unknown> = {};

        if (data.email) updateData.email = data.email;
        if (data.name) updateData.name = data.name;
        if (data.username !== undefined) updateData.username = data.username || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.nationalId !== undefined) updateData.nationalId = data.nationalId || null;
        if (data.idCardImage !== undefined) updateData.idCardImage = data.idCardImage || null;
        if (data.avatar !== undefined) updateData.avatar = data.avatar || null;
        if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
        if (data.address !== undefined) updateData.address = data.address || null;
        if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact || null;
        if (data.position !== undefined) updateData.position = data.position || null;
        if (data.salary !== undefined) updateData.salary = data.salary || null;
        if (data.hireDate !== undefined) updateData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        if (data.roleId !== undefined) updateData.roleId = data.roleId || null;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        // Hash new password if provided
        if (data.password) {
            updateData.passwordHash = await hashPassword(data.password);
        }

        await prisma.adminUser.update({
            where: { id },
            data: updateData
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Error updating team member:', error);
        return { success: false, error: 'Failed to update team member' };
    }
}

// Toggle team member active status
export async function toggleTeamMemberStatus(id: string): Promise<{ success: boolean; error?: string }> {
    await requireTeamManage();

    try {
        const member = await prisma.adminUser.findUnique({
            where: { id },
            select: { isActive: true }
        });

        if (!member) {
            return { success: false, error: 'Team member not found' };
        }

        await prisma.adminUser.update({
            where: { id },
            data: { isActive: !member.isActive }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Error toggling team member status:', error);
        return { success: false, error: 'Failed to toggle status' };
    }
}

// Delete team member
export async function deleteTeamMember(id: string): Promise<{ success: boolean; error?: string }> {
    await requireTeamDelete();

    try {
        // First, delete related sessions
        await prisma.adminSession.deleteMany({
            where: { adminId: id }
        });

        // Then delete the team member
        await prisma.adminUser.delete({
            where: { id }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Error deleting team member:', error);
        return { success: false, error: 'Failed to delete team member' };
    }
}

// Get all roles for dropdown
export async function getAdminRoles() {
    await requireTeamRead();

    return prisma.adminRole.findMany({
        select: {
            id: true,
            name: true,
            description: true
        },
        orderBy: { name: 'asc' }
    });
}
