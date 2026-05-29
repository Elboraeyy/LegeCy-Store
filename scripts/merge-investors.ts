import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const oldInvs = await prisma.investor.findMany({ where: { adminUserId: null } });
    for (const oldInv of oldInvs) {
        // Find the new investor with the same name
        const newInv = await prisma.investor.findFirst({
            where: { name: oldInv.name, adminUserId: { not: null } }
        });

        if (newInv) {
            console.log(`Migrating data from old ${oldInv.name} to new ${newInv.name}`);
            
            // Move CapitalTransactions
            await prisma.capitalTransaction.updateMany({
                where: { investorId: oldInv.id },
                data: { investorId: newInv.id }
            });

            // Move Withdrawals
            await prisma.partnerWithdrawal.updateMany({
                where: { investorId: oldInv.id },
                data: { investorId: newInv.id }
            });

            // Move MonthClosingPartner
            await prisma.monthClosingPartner.updateMany({
                where: { investorId: oldInv.id },
                data: { investorId: newInv.id }
            });

            // Now delete the old investor
            await prisma.investor.delete({ where: { id: oldInv.id } });
            console.log(`Deleted old investor: ${oldInv.name}`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
