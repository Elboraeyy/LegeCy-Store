import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class PartnerService {
  /**
   * Calculate and credit commission for a partner
   */
  async processCommission(orderId: string, partnerCode: string, orderTotal: number) {
    const partner = await prisma.partner.findUnique({
      where: { code: partnerCode }
    });

    if (!partner || !partner.isActive) {
      logger.warn(`Partner not found or inactive: ${partnerCode}`);
      return;
    }

    const commissionAmount = new Prisma.Decimal(orderTotal).mul(partner.commissionRate);

    if (commissionAmount.lte(0)) return;

    await prisma.$transaction(async (tx) => {
      // 1. Create Transaction Record
      await tx.partnerTransaction.create({
        data: {
          partnerId: partner.id,
          type: 'EARN',
          amount: commissionAmount,
          orderId: orderId,
          status: 'COMPLETED'
        }
      });

      // 2. Update Wallet Balance
      await tx.partner.update({
        where: { id: partner.id },
        data: {
          walletBalance: { increment: commissionAmount }
        }
      });
    });

    logger.info(`Commission processed for ${partnerCode}: ${commissionAmount} EGP on order ${orderId}`);
  }

  /**
   * Get partner by code (for checkout validation)
   */
  async getPartnerByCode(code: string) {
    return await prisma.partner.findUnique({
        where: { code, isActive: true },
        select: { id: true, name: true, code: true }
    });
  }

  /**
   * Create a new partner
   */
  async createPartner(data: Prisma.PartnerCreateInput) {
      return await prisma.partner.create({ data });
  }

  /**
   * Process a payout/withdrawal
   */
  async processPayout(partnerId: string, amount: number, reference: string) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
      if (!partner) throw new Error("Partner not found");
      if (partner.walletBalance.lt(amount)) throw new Error("Insufficient funds");

      await prisma.$transaction(async (tx) => {
          await tx.partnerTransaction.create({
              data: {
                  partnerId,
                  type: 'PAYOUT',
                  amount: new Prisma.Decimal(amount).negated(), // Debit
                  reference,
                  status: 'COMPLETED'
              }
          });

          await tx.partner.update({
              where: { id: partnerId },
              data: { walletBalance: { decrement: amount } }
          });
      });
      
      return true;
  }
}

export const partnerService = new PartnerService();
