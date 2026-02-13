import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export class PartnerService {
  /**
   * Calculate and credit commission for a partner
   */
  async processCommission(orderId: string, partnerCode: string, orderTotal: number, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    const partner = await db.partner.findUnique({
      where: { code: partnerCode }
    });

    if (!partner || !partner.isActive) {
      logger.warn(`Partner not found or inactive: ${partnerCode}`);
      return;
    }

    const commissionAmount = new Prisma.Decimal(orderTotal).mul(partner.commissionRate);

    if (commissionAmount.lte(0)) return;

    const execute = async (txClient: Prisma.TransactionClient) => {
      // 1. Create Transaction Record
      await txClient.partnerTransaction.create({
        data: {
          partnerId: partner.id,
          type: 'EARN',
          amount: commissionAmount,
          orderId: orderId,
          status: 'COMPLETED'
        }
      });

      // 2. Update Wallet Balance
      await txClient.partner.update({
        where: { id: partner.id },
        data: {
          walletBalance: { increment: commissionAmount }
        }
      });
    };

    if (tx) {
      await execute(tx);
    } else {
      await prisma.$transaction(execute);
    }

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

    const execute = async (txClient: Prisma.TransactionClient) => {
      await txClient.partnerTransaction.create({
              data: {
                  partnerId,
                  type: 'PAYOUT',
                  amount: new Prisma.Decimal(amount).negated(), // Debit
                  reference,
                  status: 'COMPLETED'
              }
          });

        await txClient.partner.update({
              where: { id: partnerId },
              data: { walletBalance: { decrement: amount } }
          });
    };

    await prisma.$transaction(execute);
      
      return true;
  }
}

export const partnerService = new PartnerService();
