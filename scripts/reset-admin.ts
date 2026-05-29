import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('Generating argon2 hash for password123...');
    const hash = await argon2.hash('password123', {
        timeCost: 2,
        memoryCost: 19456,
        parallelism: 1
    });

    console.log('Unlocking and updating passwords...');
    const result = await prisma.adminUser.updateMany({
        where: {},
        data: { 
            passwordHash: hash,
            failedLoginAttempts: 0,
            lockedUntil: null
        }
    });

    console.log('Updated users:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
