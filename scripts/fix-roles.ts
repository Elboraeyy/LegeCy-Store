import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const adminRole = await prisma.adminRole.findUnique({ where: { name: 'admin' } });
    if (adminRole) {
        await prisma.adminUser.updateMany({
            where: { roleId: null, email: { not: 'mohamed@legecy.store' } },
            data: { roleId: adminRole.id }
        });
        console.log('Fixed missing roles');
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
