import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Finding investors with 0 profit and 0 salary...');
    const result = await prisma.investor.deleteMany({
        where: {
            currentShare: 0,
            salaryShare: 0
        }
    });
    console.log('Deleted', result.count, 'duplicate investors.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
