import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Finding investors with null adminUserId...');
    const result = await prisma.investor.deleteMany({
        where: { adminUserId: null }
    });
    console.log('Deleted', result.count, 'duplicate orphaned investors.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
