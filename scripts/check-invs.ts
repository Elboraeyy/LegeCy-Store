import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const invs = await prisma.investor.findMany({
        where: { currentShare: 0, salaryShare: 0 }
    });
    console.log('Found investors:', invs.length);
    for (const inv of invs) {
        console.log(inv.name, inv.currentShare, inv.salaryShare, inv.adminUserId);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
