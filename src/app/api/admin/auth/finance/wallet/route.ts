import { NextRequest, NextResponse } from 'next/server';
import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateMobileToken, unauthorizedResponse } from '@/lib/auth/mobile-auth';

/**
 * GET /api/admin/finance/wallet
 * Get the current user's partner wallet (balance, earnings, history)
 * If admin is super admin, can pass ?investorId=xxx to view any partner
 */
export async function GET(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const { searchParams } = new URL(request.url);
        const investorId = searchParams.get('investorId');

        // Find the investor profile linked to this admin
        let investor;
        if (investorId) {
            // Super admin viewing a specific partner
            investor = await prisma.investor.findUnique({
                where: { id: investorId },
            });
        } else {
            // Current user's own wallet
            investor = await prisma.investor.findUnique({
                where: { adminUserId: admin.id },
            });
        }

        if (!investor) {
            // If no investor profile, return all investors (for super admin)
            const allInvestors = await prisma.investor.findMany({
                where: { isActive: true, type: 'PARTNER' },
                orderBy: { name: 'asc' },
            });

            return NextResponse.json({
                isPartner: false,
                partners: allInvestors.map(i => ({
                    id: i.id,
                    name: i.name,
                    currentShare: i.currentShare.toNumber(),
                    walletBalance: i.walletBalance.toNumber(),
                    totalEarnings: i.totalEarnings.toNumber(),
                    totalWithdrawn: i.totalWithdrawn.toNumber(),
                })),
            });
        }

        // Get transaction history (month closing distributions + withdrawals)
        const monthDistributions = await prisma.monthClosingPartner.findMany({
            where: { investorId: investor.id },
            include: {
                monthClosing: { select: { month: true, year: true, status: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 24,
        });

        const withdrawals = await prisma.partnerWithdrawal.findMany({
            where: { investorId: investor.id },
            include: {
                safe: { select: { name: true } },
                approvedBy: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Build unified transaction history
        const history: Array<{
            id: string;
            type: string;
            amount: number;
            description: string;
            status: string;
            date: string;
        }> = [];

        for (const md of monthDistributions) {
            history.push({
                id: md.id,
                type: 'EARNING',
                amount: md.totalShare.toNumber(),
                description: `أرباح شهر ${md.monthClosing.month}/${md.monthClosing.year} (ربح: ${md.profitShare.toNumber()} + مرتب: ${md.salaryShare.toNumber()})`,
                status: 'COMPLETED',
                date: md.createdAt.toISOString(),
            });
        }

        for (const w of withdrawals) {
            history.push({
                id: w.id,
                type: 'WITHDRAWAL',
                amount: -w.amount.toNumber(),
                description: w.notes || `سحب${w.safe ? ` من ${w.safe.name}` : ''}`,
                status: w.status,
                date: w.createdAt.toISOString(),
            });
        }

        // Sort by date descending
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            isPartner: true,
            wallet: {
                investorId: investor.id,
                name: investor.name,
                currentShare: investor.currentShare.toNumber(),
                walletBalance: investor.walletBalance.toNumber(),
                totalEarnings: investor.totalEarnings.toNumber(),
                totalWithdrawn: investor.totalWithdrawn.toNumber(),
            },
            history,
        });
    } catch (error) {
        console.error('Wallet GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }
}

/**
 * POST /api/admin/finance/wallet
 * Create a withdrawal request OR deposit (add money back)
 * Body: { action: "withdraw" | "deposit", amount, notes, investorId? }
 */
export async function POST(request: NextRequest) {
    const admin = await validateMobileToken(request);
    if (!admin) return unauthorizedResponse();

    try {
        const body = await request.json();
        const { action, amount, notes, investorId: targetInvestorId } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Find investor
        let investor;
        if (targetInvestorId) {
            investor = await prisma.investor.findUnique({ where: { id: targetInvestorId } });
        } else {
            investor = await prisma.investor.findUnique({ where: { adminUserId: admin.id } });
        }

        if (!investor) {
            return NextResponse.json({ error: 'Investor profile not found' }, { status: 404 });
        }

        if (action === 'deposit') {
            // Partner is adding money back (paying off a debt/advance)
            await prisma.investor.update({
                where: { id: investor.id },
                data: {
                    walletBalance: { increment: amount },
                },
            });

            return NextResponse.json({ success: true, message: 'Deposit recorded' });
        }

        // Default: Create withdrawal request
        const withdrawal = await prisma.partnerWithdrawal.create({
            data: {
                investorId: investor.id,
                amount,
                notes: notes || undefined,
                status: 'PENDING',
            },
        });

        return NextResponse.json({ success: true, withdrawal });
    } catch (error) {
        console.error('Wallet POST Error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
