'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '@/lib/auth/guards';
import { AdminPermissions } from '@/lib/auth/permissions';

// ==========================================
// Types
// ==========================================

export interface EmployeeWithStats {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    position: string | null;
    salary: number | null;
    hireDate: Date | null;
    isActive: boolean;
    lastLoginAt: Date | null;
    role: { id: string; name: string } | null;
    phone: string | null;
    monthlyRating: number;
    totalRatings: number;
}

export interface EmployeeStats {
    totalEmployees: number;
    activeEmployees: number;
    totalMonthlySalary: number;
    avgRatingThisMonth: number;
    topPerformer: { name: string; score: number } | null;
    pendingLeaves: number;
    paidThisMonth: number;
}

export interface MonthlyRanking {
    employeeId: string;
    employeeName: string;
    avatar: string | null;
    position: string | null;
    totalScore: number;
    avgScore: number;
    ratingCount: number;
    rank: number;
}

export interface SalaryHistoryItem {
    id: string;
    baseSalary: number;
    bonusAmount: number;
    deductions: number;
    netAmount: number;
    month: number;
    year: number;
    paymentDate: Date;
    paymentMethod: string | null;
    notes: string | null;
}

// ==========================================
// Employee Stats
// ==========================================

export async function getEmployeeStats(): Promise<EmployeeStats> {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfMonth = new Date(currentYear, currentMonth, 0);

        const [
            totalEmployees,
            activeEmployees,
            allEmployees,
            ratingsThisMonth,
            pendingLeaves,
            paymentsThisMonth
        ] = await Promise.all([
            prisma.adminUser.count(),
            prisma.adminUser.count({ where: { isActive: true } }),
            prisma.adminUser.findMany({ select: { salary: true } }),
            prisma.employeeRating.findMany({
                where: {
                    date: { gte: startOfMonth, lte: endOfMonth }
                },
                include: { employee: { select: { name: true } } }
            }),
            prisma.employeeLeave.count({ where: { status: 'pending' } }),
            prisma.salaryPayment.count({
                where: { month: currentMonth, year: currentYear }
            })
        ]);

        const totalMonthlySalary = allEmployees.reduce(
            (sum, e) => sum + (e.salary ? Number(e.salary) : 0), 0
        );

        const avgRatingThisMonth = ratingsThisMonth.length > 0
            ? ratingsThisMonth.reduce((sum, r) => sum + r.score, 0) / ratingsThisMonth.length
            : 0;

        // Find top performer
        const employeeScores = new Map<string, { name: string; total: number; count: number }>();
        for (const r of ratingsThisMonth) {
            const existing = employeeScores.get(r.employeeId);
            if (existing) {
                existing.total += r.score;
                existing.count += 1;
            } else {
                employeeScores.set(r.employeeId, {
                    name: r.employee.name,
                    total: r.score,
                    count: 1
                });
            }
        }

        let topPerformer: { name: string; score: number } | null = null;
        let maxAvg = 0;
        for (const [, data] of employeeScores) {
            const avg = data.total / data.count;
            if (avg > maxAvg) {
                maxAvg = avg;
                topPerformer = { name: data.name, score: Math.round(avg * 10) / 10 };
            }
        }

        return {
            totalEmployees,
            activeEmployees,
            totalMonthlySalary,
            avgRatingThisMonth: Math.round(avgRatingThisMonth * 10) / 10,
            topPerformer,
            pendingLeaves,
            paidThisMonth: paymentsThisMonth
        };
    } catch (error) {
        console.error('Get employee stats error:', error);
        return {
            totalEmployees: 0,
            activeEmployees: 0,
            totalMonthlySalary: 0,
            avgRatingThisMonth: 0,
            topPerformer: null,
            pendingLeaves: 0,
            paidThisMonth: 0
        };
    }
}

// ==========================================
// Get Employees with Monthly Ratings
// ==========================================

export async function getEmployeesWithStats(): Promise<EmployeeWithStats[]> {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const employees = await prisma.adminUser.findMany({
            orderBy: { name: 'asc' },
            include: {
                role: { select: { id: true, name: true } },
                ratings: {
                    where: {
                        date: { gte: startOfMonth, lte: endOfMonth }
                    }
                }
            }
        });

        return employees.map(e => ({
            id: e.id,
            name: e.name,
            email: e.email,
            avatar: e.avatar,
            position: e.position,
            salary: e.salary ? Number(e.salary) : null,
            hireDate: e.hireDate,
            isActive: e.isActive,
            lastLoginAt: e.lastLoginAt,
            role: e.role,
            phone: e.phone,
            monthlyRating: e.ratings.length > 0
                ? Math.round((e.ratings.reduce((sum, r) => sum + r.score, 0) / e.ratings.length) * 10) / 10
                : 0,
            totalRatings: e.ratings.length
        }));
    } catch (error) {
        console.error('Get employees with stats error:', error);
        return [];
    }
}

// ==========================================
// Rating Functions
// ==========================================

export async function addDailyRating(
    employeeId: string,
    score: number,
    date: Date,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.TEAM.MANAGE);

        if (score < 0 || score > 10) {
            return { success: false, error: 'Score must be between 0 and 10' };
        }

        // Normalize date to start of day
        const ratingDate = new Date(date);
        ratingDate.setHours(0, 0, 0, 0);

        await prisma.employeeRating.upsert({
            where: {
                employeeId_date: {
                    employeeId,
                    date: ratingDate
                }
            },
            create: {
                employeeId,
                score,
                date: ratingDate,
                notes,
                ratedById: admin.id
            },
            update: {
                score,
                notes,
                ratedById: admin.id
            }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Add rating error:', error);
        return { success: false, error: 'Failed to add rating' };
    }
}

export async function getEmployeeRatings(
    employeeId: string,
    month: number,
    year: number
): Promise<Array<{ date: Date; score: number; notes: string | null }>> {
    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const ratings = await prisma.employeeRating.findMany({
            where: {
                employeeId,
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            orderBy: { date: 'asc' }
        });

        return ratings.map(r => ({
            date: r.date,
            score: r.score,
            notes: r.notes
        }));
    } catch (error) {
        console.error('Get employee ratings error:', error);
        return [];
    }
}

export async function getMonthlyRankings(
    month: number,
    year: number
): Promise<MonthlyRanking[]> {
    try {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0);

        const ratings = await prisma.employeeRating.findMany({
            where: {
                date: { gte: startOfMonth, lte: endOfMonth }
            },
            include: {
                employee: {
                    select: { id: true, name: true, avatar: true, position: true }
                }
            }
        });

        // Aggregate by employee
        const employeeScores = new Map<string, {
            employee: { id: string; name: string; avatar: string | null; position: string | null };
            totalScore: number;
            count: number;
        }>();

        for (const r of ratings) {
            const existing = employeeScores.get(r.employeeId);
            if (existing) {
                existing.totalScore += r.score;
                existing.count += 1;
            } else {
                employeeScores.set(r.employeeId, {
                    employee: r.employee,
                    totalScore: r.score,
                    count: 1
                });
            }
        }

        // Convert to array and sort
        const rankings = Array.from(employeeScores.values())
            .map(data => ({
                employeeId: data.employee.id,
                employeeName: data.employee.name,
                avatar: data.employee.avatar,
                position: data.employee.position,
                totalScore: data.totalScore,
                avgScore: Math.round((data.totalScore / data.count) * 10) / 10,
                ratingCount: data.count,
                rank: 0
            }))
            .sort((a, b) => b.avgScore - a.avgScore || b.totalScore - a.totalScore);

        // Assign ranks
        rankings.forEach((r, i) => { r.rank = i + 1; });

        return rankings;
    } catch (error) {
        console.error('Get monthly rankings error:', error);
        return [];
    }
}

// ==========================================
// Salary Functions
// ==========================================

export async function paySalary(
    employeeId: string,
    baseSalary: number,
    bonus: number = 0,
    deductions: number = 0,
    month: number,
    year: number,
    paymentMethod?: string,
    notes?: string,
    vaultId?: string
): Promise<{ success: boolean; error?: string; paymentId?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.TEAM.MANAGE);

        const netAmount = baseSalary + bonus - deductions;

        if (netAmount <= 0) {
            return { success: false, error: 'Net amount must be positive' };
        }

        // Check if already paid for this month
        const existing = await prisma.salaryPayment.findFirst({
            where: { employeeId, month, year }
        });

        if (existing) {
            return { success: false, error: `Salary already paid for ${month}/${year}` };
        }

        // Get employee name for description
        const employee = await prisma.adminUser.findUnique({
            where: { id: employeeId },
            select: { name: true }
        });

        // Get vault (default to 1001 Cash if not specified)
        let vault = null;
        if (vaultId) {
            vault = await prisma.account.findUnique({ where: { id: vaultId } });
        }
        if (!vault) {
            vault = await prisma.account.findFirst({ where: { code: '1001' } });
        }

        // Get or create salary expense account
        let salaryExpenseAccount = await prisma.account.findFirst({
            where: { code: '5001' }
        });

        if (!salaryExpenseAccount) {
            salaryExpenseAccount = await prisma.account.create({
                data: {
                    code: '5001',
                    name: 'Salaries & Wages',
                    type: 'EXPENSE',
                    balance: 0,
                    isSystem: true
                }
            });
        }

        // Create salary payment with journal entry
        const payment = await prisma.$transaction(async (tx) => {
            // 1. Create salary payment record
            const salaryPayment = await tx.salaryPayment.create({
                data: {
                    employeeId,
                    baseSalary,
                    bonusAmount: bonus,
                    deductions,
                    netAmount,
                    month,
                    year,
                    paymentMethod,
                    notes,
                    paidById: admin.id
                }
            });

            // 2. Create journal entry if vault exists
            if (vault) {
                const journal = await tx.journalEntry.create({
                    data: {
                        description: `Salary Payment - ${employee?.name || 'Employee'} (${month}/${year})`,
                        date: new Date(),
                        status: 'POSTED',
                        createdBy: admin.id
                    }
                });

                // Debit Expense (increases)
                await tx.transactionLine.create({
                    data: {
                        journalEntryId: journal.id,
                        accountId: salaryExpenseAccount!.id,
                        debit: netAmount,
                        credit: 0,
                        description: `Salary: ${employee?.name}`
                    }
                });
                await tx.account.update({
                    where: { id: salaryExpenseAccount!.id },
                    data: { balance: { increment: netAmount } }
                });

                // Credit Vault (decreases)
                await tx.transactionLine.create({
                    data: {
                        journalEntryId: journal.id,
                        accountId: vault.id,
                        debit: 0,
                        credit: netAmount,
                        description: `Payment from ${vault.name}`
                    }
                });
                await tx.account.update({
                    where: { id: vault.id },
                    data: { balance: { decrement: netAmount } }
                });

                // Link journal to payment
                await tx.salaryPayment.update({
                    where: { id: salaryPayment.id },
                    data: { journalEntryId: journal.id }
                });
            }

            return salaryPayment;
        });

        revalidatePath('/admin/team');
        revalidatePath('/admin/team/payroll');
        revalidatePath('/admin/finance');
        revalidatePath('/admin/finance/treasury');
        return { success: true, paymentId: payment.id };
    } catch (error) {
        console.error('Pay salary error:', error);
        return { success: false, error: 'Failed to process salary payment' };
    }
}

export async function getSalaryHistory(employeeId: string): Promise<SalaryHistoryItem[]> {
    try {
        const payments = await prisma.salaryPayment.findMany({
            where: { employeeId },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });

        return payments.map(p => ({
            id: p.id,
            baseSalary: Number(p.baseSalary),
            bonusAmount: Number(p.bonusAmount),
            deductions: Number(p.deductions),
            netAmount: Number(p.netAmount),
            month: p.month,
            year: p.year,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            notes: p.notes
        }));
    } catch (error) {
        console.error('Get salary history error:', error);
        return [];
    }
}

export async function getPayrollSummary(month: number, year: number): Promise<{
    totalPaid: number;
    totalEmployees: number;
    payments: Array<{
        employeeId: string;
        employeeName: string;
        netAmount: number;
        paymentDate: Date;
    }>;
    unpaidEmployees: Array<{ id: string; name: string; salary: number }>;
}> {
    try {
        const [payments, allEmployees] = await Promise.all([
            prisma.salaryPayment.findMany({
                where: { month, year },
                include: { employee: { select: { id: true, name: true } } }
            }),
            prisma.adminUser.findMany({
                where: { isActive: true },
                select: { id: true, name: true, salary: true }
            })
        ]);

        const paidIds = new Set(payments.map(p => p.employeeId));
        const unpaidEmployees = allEmployees
            .filter(e => !paidIds.has(e.id) && e.salary)
            .map(e => ({ id: e.id, name: e.name, salary: Number(e.salary) }));

        return {
            totalPaid: payments.reduce((sum, p) => sum + Number(p.netAmount), 0),
            totalEmployees: payments.length,
            payments: payments.map(p => ({
                employeeId: p.employeeId,
                employeeName: p.employee.name,
                netAmount: Number(p.netAmount),
                paymentDate: p.paymentDate
            })),
            unpaidEmployees
        };
    } catch (error) {
        console.error('Get payroll summary error:', error);
        return { totalPaid: 0, totalEmployees: 0, payments: [], unpaidEmployees: [] };
    }
}

// ==========================================
// Leave Functions
// ==========================================

export async function requestLeave(
    employeeId: string,
    type: string,
    startDate: Date,
    endDate: Date,
    reason?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDays <= 0) {
            return { success: false, error: 'End date must be after start date' };
        }

        await prisma.employeeLeave.create({
            data: {
                employeeId,
                type,
                startDate: start,
                endDate: end,
                totalDays,
                reason
            }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Request leave error:', error);
        return { success: false, error: 'Failed to submit leave request' };
    }
}

export async function approveLeave(leaveId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.TEAM.MANAGE);

        await prisma.employeeLeave.update({
            where: { id: leaveId },
            data: {
                status: 'approved',
                approvedById: admin.id,
                approvedAt: new Date()
            }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Approve leave error:', error);
        return { success: false, error: 'Failed to approve leave' };
    }
}

export async function rejectLeave(
    leaveId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const admin = await requireAdminPermission(AdminPermissions.TEAM.MANAGE);

        await prisma.employeeLeave.update({
            where: { id: leaveId },
            data: {
                status: 'rejected',
                approvedById: admin.id,
                approvedAt: new Date(),
                rejectionNote: reason
            }
        });

        revalidatePath('/admin/team');
        return { success: true };
    } catch (error) {
        console.error('Reject leave error:', error);
        return { success: false, error: 'Failed to reject leave' };
    }
}

export async function getEmployeeLeaves(employeeId: string): Promise<Array<{
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    status: string;
    reason: string | null;
}>> {
    try {
        const leaves = await prisma.employeeLeave.findMany({
            where: { employeeId },
            orderBy: { startDate: 'desc' }
        });

        return leaves.map(l => ({
            id: l.id,
            type: l.type,
            startDate: l.startDate,
            endDate: l.endDate,
            totalDays: l.totalDays,
            status: l.status,
            reason: l.reason
        }));
    } catch (error) {
        console.error('Get employee leaves error:', error);
        return [];
    }
}

export async function getPendingLeaves(): Promise<Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    type: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    reason: string | null;
    createdAt: Date;
}>> {
    try {
        const leaves = await prisma.employeeLeave.findMany({
            where: { status: 'pending' },
            include: { employee: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' }
        });

        return leaves.map(l => ({
            id: l.id,
            employeeId: l.employee.id,
            employeeName: l.employee.name,
            type: l.type,
            startDate: l.startDate,
            endDate: l.endDate,
            totalDays: l.totalDays,
            reason: l.reason,
            createdAt: l.createdAt
        }));
    } catch (error) {
        console.error('Get pending leaves error:', error);
        return [];
    }
}
