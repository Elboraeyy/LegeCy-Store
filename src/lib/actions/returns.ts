"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { approveReturnRequest, rejectReturnRequest, completeRefund, checkRefundEligibility } from "@/lib/services/refundService";
import { requireAdminPermission } from "@/lib/auth/guards";
import { AdminPermissions } from "@/lib/auth/permissions";

// ==========================================
// Types
// ==========================================

export interface ReturnWithDetails {
    id: string;
    orderId: string;
    order: {
        id: string;
        totalPrice: number;
        customerName: string | null;
        customerEmail: string | null;
        customerPhone: string | null;
        createdAt: Date;
        deliveredAt: Date | null;
        paymentMethod: string;
        items: Array<{
            id: string;
            name: string;
            sku: string | null;
            price: number;
            quantity: number;
        }>;
    };
    reason: string;
    description: string | null;
    items: unknown;
    images: string[];
    returnType: string;
    status: string;
    adminNote: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReturnStats {
    total: number;
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    totalRefundAmount: number;
    pendingRefundAmount: number;
    avgProcessingDays: number;
    returnRate: number;
}

export interface ReturnFilters {
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}

// ==========================================
// Get Return Requests (List with Filtering)
// ==========================================

export async function getReturnRequests(filters: ReturnFilters = {}): Promise<{
    returns: ReturnWithDetails[];
    total: number;
    page: number;
    totalPages: number;
}> {
    try {
        const { status, search, startDate, endDate, page = 1, limit = 20 } = filters;
        const skip = (page - 1) * limit;

        const where: Prisma.ReturnRequestWhereInput = {};

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: 'insensitive' } },
                { order: { customerEmail: { contains: search, mode: 'insensitive' } } },
                { order: { customerName: { contains: search, mode: 'insensitive' } } },
            ];
        }

        if (startDate) {
            where.createdAt = { ...where.createdAt as object, gte: new Date(startDate) };
        }

        if (endDate) {
            where.createdAt = { ...where.createdAt as object, lte: new Date(endDate) };
        }

        const [returns, total] = await Promise.all([
            prisma.returnRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    order: {
                        include: {
                            items: true
                        }
                    }
                }
            }),
            prisma.returnRequest.count({ where })
        ]);

        const formattedReturns: ReturnWithDetails[] = returns.map(r => ({
            id: r.id,
            orderId: r.orderId,
            order: {
                id: r.order.id,
                totalPrice: Number(r.order.totalPrice),
                customerName: r.order.customerName,
                customerEmail: r.order.customerEmail,
                customerPhone: r.order.customerPhone,
                createdAt: r.order.createdAt,
                deliveredAt: r.order.deliveredAt,
                paymentMethod: r.order.paymentMethod,
                items: r.order.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    price: Number(item.price),
                    quantity: item.quantity
                }))
            },
            reason: r.reason,
            description: r.description || null,
            items: r.items,
            images: r.images || [],
            returnType: r.returnType || 'refund',
            status: r.status,
            adminNote: r.adminNote,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        }));

        return {
            returns: formattedReturns,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    } catch (error) {
        console.error('Get Return Requests Error:', error);
        return { returns: [], total: 0, page: 1, totalPages: 1 };
    }
}

// ==========================================
// Get Single Return Request
// ==========================================

export async function getReturnRequestById(id: string): Promise<ReturnWithDetails | null> {
    try {
        const r = await prisma.returnRequest.findUnique({
            where: { id },
            include: {
                order: {
                    include: {
                        items: true,
                        paymentIntent: true
                    }
                }
            }
        });

        if (!r) return null;

        return {
            id: r.id,
            orderId: r.orderId,
            order: {
                id: r.order.id,
                totalPrice: Number(r.order.totalPrice),
                customerName: r.order.customerName,
                customerEmail: r.order.customerEmail,
                customerPhone: r.order.customerPhone,
                createdAt: r.order.createdAt,
                deliveredAt: r.order.deliveredAt,
                paymentMethod: r.order.paymentMethod,
                items: r.order.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    sku: item.sku,
                    price: Number(item.price),
                    quantity: item.quantity
                }))
            },
            reason: r.reason,
            description: r.description || null,
            items: r.items,
            images: r.images || [],
            returnType: r.returnType || 'refund',
            status: r.status,
            adminNote: r.adminNote,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt
        };
    } catch (error) {
        console.error('Get Return Request By ID Error:', error);
        return null;
    }
}

// ==========================================
// Get Return Stats for Dashboard
// ==========================================

export async function getReturnStats(): Promise<ReturnStats> {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            total,
            pending,
            approved,
            completed,
            rejected,
            pendingReturns,
            completedReturns,
            totalOrdersLast30
        ] = await Promise.all([
            prisma.returnRequest.count(),
            prisma.returnRequest.count({ where: { status: 'pending' } }),
            prisma.returnRequest.count({ where: { status: 'approved' } }),
            prisma.returnRequest.count({ where: { status: 'completed' } }),
            prisma.returnRequest.count({ where: { status: 'rejected' } }),
            prisma.returnRequest.findMany({
                where: { status: 'pending' },
                include: { order: true }
            }),
            prisma.returnRequest.findMany({
                where: { status: 'completed' },
                include: { order: true }
            }),
            prisma.order.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            })
        ]);

        const pendingRefundAmount = pendingReturns.reduce(
            (sum, r) => sum + Number(r.order.totalPrice), 0
        );

        const totalRefundAmount = completedReturns.reduce(
            (sum, r) => sum + Number(r.order.totalPrice), 0
        );

        // Calculate average processing days
        let avgProcessingDays = 0;
        if (completedReturns.length > 0) {
            const totalDays = completedReturns.reduce((sum, r) => {
                const days = (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
            }, 0);
            avgProcessingDays = totalDays / completedReturns.length;
        }

        // Return rate (returns in last 30 days / orders in last 30 days)
        const returnsLast30 = await prisma.returnRequest.count({
            where: { createdAt: { gte: thirtyDaysAgo } }
        });
        const returnRate = totalOrdersLast30 > 0 ? (returnsLast30 / totalOrdersLast30) * 100 : 0;

        return {
            total,
            pending,
            approved,
            completed,
            rejected,
            totalRefundAmount,
            pendingRefundAmount,
            avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
            returnRate: Math.round(returnRate * 100) / 100
        };
    } catch (error) {
        console.error('Get Return Stats Error:', error);
        return {
            total: 0,
            pending: 0,
            approved: 0,
            completed: 0,
            rejected: 0,
            totalRefundAmount: 0,
            pendingRefundAmount: 0,
            avgProcessingDays: 0,
            returnRate: 0
        };
    }
}

// ==========================================
// Create Return Request
// ==========================================

export async function createReturnRequest(
    orderId: string, 
    reason: string, 
    items: { id: string; quantity: number }[]
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) throw new Error("Order not found");
        if (order.status !== 'delivered') throw new Error("Only delivered orders can be returned");

        const existing = await prisma.returnRequest.findUnique({
            where: { orderId }
        });
        if (existing) throw new Error("A return request already exists for this order");

        await prisma.returnRequest.create({
            data: {
                orderId,
                reason,
                items: items as unknown as Prisma.InputJsonValue,
                status: 'pending'
            }
        });

        revalidatePath(`/orders/${orderId}`);
        revalidatePath('/admin/orders/returns');
        return { success: true };
    } catch (error: unknown) {
        console.error("Return Request Error:", error);
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: msg };
    }
}

// ==========================================
// Approve Return Action
// ==========================================

export async function approveRefundAction(requestId: string, amount?: number) {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        const result = await approveReturnRequest(requestId, admin.id, amount);
        revalidatePath('/admin/orders');
        revalidatePath('/admin/orders/returns');
        return result;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unauthorized";
        return { success: false, message: msg };
    }
}

// ==========================================
// Reject Return Action
// ==========================================

export async function rejectRefundAction(requestId: string, reason: string) {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        const result = await rejectReturnRequest(requestId, admin.id, reason);
        revalidatePath('/admin/orders');
        revalidatePath('/admin/orders/returns');
        return result;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unauthorized";
        return { success: false, message: msg };
    }
}

// ==========================================
// Complete Refund Action
// ==========================================

export async function completeRefundAction(requestId: string, transactionReference?: string) {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        const result = await completeRefund(requestId, admin.id, transactionReference);
        revalidatePath('/admin/orders');
        revalidatePath('/admin/orders/returns');
        return result;
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unauthorized";
        return { success: false, message: msg };
    }
}

// ==========================================
// Add Admin Note
// ==========================================

export async function addReturnNote(requestId: string, note: string) {
    try {
        await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        
        const current = await prisma.returnRequest.findUnique({
            where: { id: requestId }
        });

        if (!current) {
            return { success: false, error: 'Return request not found' };
        }

        const existingNote = current.adminNote || '';
        const timestamp = new Date().toISOString().split('T')[0];
        const newNote = existingNote 
            ? `${existingNote}\n[${timestamp}] ${note}` 
            : `[${timestamp}] ${note}`;

        await prisma.returnRequest.update({
            where: { id: requestId },
            data: { adminNote: newNote }
        });

        revalidatePath('/admin/orders/returns');
        return { success: true };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Failed to add note";
        return { success: false, error: msg };
    }
}

// ==========================================
// Check Refund Eligibility (wrapper for client)
// ==========================================

export async function checkOrderRefundEligibility(orderId: string) {
    try {
        return await checkRefundEligibility(orderId);
    } catch (error) {
        console.error('Check eligibility error:', error);
        return { eligible: false, reason: 'Error checking eligibility' };
    }
}

// ==========================================
// Bulk Update Status
// ==========================================

export async function bulkUpdateReturnStatus(
    ids: string[], 
    action: 'approve' | 'reject',
    reason?: string
): Promise<{ success: boolean; processed: number; errors: string[] }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.ORDERS.MANAGE);
        const errors: string[] = [];
        let processed = 0;

        for (const id of ids) {
            try {
                if (action === 'approve') {
                    await approveReturnRequest(id, admin.id);
                } else {
                    await rejectReturnRequest(id, admin.id, reason || 'Bulk rejection');
                }
                processed++;
            } catch (e) {
                errors.push(`Failed to ${action} ${id}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            }
        }

        revalidatePath('/admin/orders/returns');
        return { success: errors.length === 0, processed, errors };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unauthorized";
        return { success: false, processed: 0, errors: [msg] };
    }
}

