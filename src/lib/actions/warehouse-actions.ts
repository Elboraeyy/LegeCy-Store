'use server';

import prismaClient from '@/lib/prisma';
import { validateAdminSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

const prisma = prismaClient!;

// --- Types ---

export type WarehouseWithStats = {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    city: string | null;
    country: string;
    phone: string | null;
    email: string | null;
    managerId: string | null;
    managerName: string | null;
    type: string;
    isActive: boolean;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    // Stats
    totalItems: number;
    totalQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
};

export type WarehouseFormData = {
    name: string;
    code?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    managerId?: string;
    type?: string;
    notes?: string;
};

// --- Actions ---

export async function fetchWarehouses(): Promise<WarehouseWithStats[]> {
    try {
        await validateAdminSession();
        
        const warehouses = await prisma.warehouse.findMany({
            where: { isActive: true },
            include: {
                manager: { select: { name: true } },
                inventory: { select: { available: true, minStock: true } }
            },
            orderBy: { name: 'asc' }
        });

        return warehouses.map(wh => {
            const totalItems = wh.inventory.length;
            const totalQuantity = wh.inventory.reduce((sum, inv) => sum + inv.available, 0);
            const lowStockCount = wh.inventory.filter(inv => inv.available > 0 && inv.available <= inv.minStock).length;
            const outOfStockCount = wh.inventory.filter(inv => inv.available === 0).length;

            return {
                id: wh.id,
                name: wh.name,
                code: wh.code,
                address: wh.address,
                city: wh.city,
                country: wh.country,
                phone: wh.phone,
                email: wh.email,
                managerId: wh.managerId,
                managerName: wh.manager?.name || null,
                type: wh.type,
                isActive: wh.isActive,
                notes: wh.notes,
                createdAt: wh.createdAt,
                updatedAt: wh.updatedAt,
                totalItems,
                totalQuantity,
                lowStockCount,
                outOfStockCount
            };
        });
    } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        return [];
    }
}

export async function fetchWarehouseById(id: string): Promise<WarehouseWithStats | null> {
    try {
        await validateAdminSession();
        
        const wh = await prisma.warehouse.findUnique({
            where: { id },
            include: {
                manager: { select: { name: true } },
                inventory: { select: { available: true, minStock: true } }
            }
        });

        if (!wh) return null;

        const totalItems = wh.inventory.length;
        const totalQuantity = wh.inventory.reduce((sum, inv) => sum + inv.available, 0);
        const lowStockCount = wh.inventory.filter(inv => inv.available > 0 && inv.available <= inv.minStock).length;
        const outOfStockCount = wh.inventory.filter(inv => inv.available === 0).length;

        return {
            id: wh.id,
            name: wh.name,
            code: wh.code,
            address: wh.address,
            city: wh.city,
            country: wh.country,
            phone: wh.phone,
            email: wh.email,
            managerId: wh.managerId,
            managerName: wh.manager?.name || null,
            type: wh.type,
            isActive: wh.isActive,
            notes: wh.notes,
            createdAt: wh.createdAt,
            updatedAt: wh.updatedAt,
            totalItems,
            totalQuantity,
            lowStockCount,
            outOfStockCount
        };
    } catch (error) {
        console.error('Failed to fetch warehouse:', error);
        return null;
    }
}

export async function createWarehouse(data: WarehouseFormData) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        // Check for duplicate name
        const existing = await prisma.warehouse.findUnique({ where: { name: data.name } });
        if (existing) return { error: 'Warehouse with this name already exists' };

        // Check for duplicate code if provided
        if (data.code) {
            const existingCode = await prisma.warehouse.findUnique({ where: { code: data.code } });
            if (existingCode) return { error: 'Warehouse with this code already exists' };
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                name: data.name,
                code: data.code || null,
                address: data.address || null,
                city: data.city || null,
                country: data.country || 'Egypt',
                phone: data.phone || null,
                email: data.email || null,
                managerId: data.managerId || null,
                type: data.type || 'MAIN',
                notes: data.notes || null,
            }
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/inventory/warehouses');
        
        return { success: true, warehouse };
    } catch (error) {
        console.error('Failed to create warehouse:', error);
        return { error: 'Failed to create warehouse' };
    }
}

export async function updateWarehouse(id: string, data: WarehouseFormData) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        // Check for duplicate name (excluding current)
        const existing = await prisma.warehouse.findFirst({ 
            where: { name: data.name, NOT: { id } } 
        });
        if (existing) return { error: 'Warehouse with this name already exists' };

        // Check for duplicate code if provided (excluding current)
        if (data.code) {
            const existingCode = await prisma.warehouse.findFirst({ 
                where: { code: data.code, NOT: { id } } 
            });
            if (existingCode) return { error: 'Warehouse with this code already exists' };
        }

        const warehouse = await prisma.warehouse.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code || null,
                address: data.address || null,
                city: data.city || null,
                country: data.country || 'Egypt',
                phone: data.phone || null,
                email: data.email || null,
                managerId: data.managerId || null,
                type: data.type || 'MAIN',
                notes: data.notes || null,
            }
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/inventory/warehouses');
        
        return { success: true, warehouse };
    } catch (error) {
        console.error('Failed to update warehouse:', error);
        return { error: 'Failed to update warehouse' };
    }
}

export async function toggleWarehouseActive(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) return { error: 'Warehouse not found' };

        await prisma.warehouse.update({
            where: { id },
            data: { isActive: !warehouse.isActive }
        });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/inventory/warehouses');
        
        return { success: true, isActive: !warehouse.isActive };
    } catch (error) {
        console.error('Failed to toggle warehouse:', error);
        return { error: 'Failed to update warehouse status' };
    }
}

export async function deleteWarehouse(id: string) {
    try {
        const session = await validateAdminSession();
        if (!session.user) return { error: 'Unauthorized' };

        // Check if warehouse has inventory
        const inventoryCount = await prisma.inventory.count({ where: { warehouseId: id } });
        if (inventoryCount > 0) {
            return { error: `Cannot delete warehouse with ${inventoryCount} inventory items. Please transfer or remove stock first.` };
        }

        await prisma.warehouse.delete({ where: { id } });

        revalidatePath('/admin/inventory');
        revalidatePath('/admin/inventory/warehouses');
        
        return { success: true };
    } catch (error) {
        console.error('Failed to delete warehouse:', error);
        return { error: 'Failed to delete warehouse' };
    }
}

// Fetch admin users for manager dropdown
export async function fetchAdminUsersForDropdown() {
    try {
        await validateAdminSession();
        
        const admins = await prisma.adminUser.findMany({
            where: { isActive: true },
            select: { id: true, name: true, username: true },
            orderBy: { name: 'asc' }
        });

        return admins.map(a => ({
            id: a.id,
            name: a.username || a.name
        }));
    } catch (error) {
        console.error('Failed to fetch admins:', error);
        return [];
    }
}
