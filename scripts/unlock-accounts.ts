import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Unlocking all admin accounts...');
    
    const result = await prisma.adminUser.updateMany({
        data: { 
            failedLoginAttempts: 0,
            lockedUntil: null
        }
    });

    console.log('Unlocked users:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
