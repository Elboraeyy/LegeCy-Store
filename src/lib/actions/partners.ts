'use server';

import prisma from '@/lib/prisma';
import { partnerService } from '@/lib/services/partnerService';
import { revalidatePath } from 'next/cache';

export async function getPartners() {
    const partners = await prisma.partner.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
           _count: {
               select: { transactions: true }
           }
        }
    });
    return partners;
}

export async function createPartner(formData: FormData) {
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const email = formData.get('email') as string;
    const rate = Number(formData.get('rate') || 0.10);

    await partnerService.createPartner({
        name,
        code,
        email,
        commissionRate: rate,
        walletBalance: 0
    });
    
    revalidatePath('/admin/partners');
}

export async function processPayoutAction(partnerId: string, amount: number, reference: string) {
    await partnerService.processPayout(partnerId, amount, reference);
    revalidatePath('/admin/partners');
}

export async function getPartnerDetails(id: string) {
    const partner = await prisma.partner.findUnique({
        where: { id },
        include: {
            transactions: {
                orderBy: { createdAt: 'desc' },
                take: 50 // Last 50 txs
            }
        }
    });
    return partner;
}
