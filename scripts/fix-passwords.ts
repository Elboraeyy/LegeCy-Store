import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Hashing passwords...');
    const hashed = await bcrypt.hash('password123', 10);
    
    const emails = [
        'mohamed@legecy.store',
        'ahmed@legecy.store',
        'yousef@legecy.store',
        'ezzat@legecy.store',
        'kareem@legecy.store',
        'ehab@legecy.store',
        'malek@legecy.store',
        'moataz@legecy.store'
    ];

    const result = await prisma.adminUser.updateMany({
        where: { email: { in: emails } },
        data: { passwordHash: hashed }
    });

    console.log('Updated users:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
