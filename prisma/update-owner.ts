import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateToOwner() {
    console.log('🔄 Updating admin to owner role...');
    
    // Create or get owner role
    const ownerRole = await prisma.adminRole.upsert({
        where: { name: 'owner' },
        update: {},
        create: {
            name: 'owner',
            description: 'Store owner with full access',
            permissions: 'ALL'
        }
    });
    console.log('👑 Owner role:', ownerRole.name);
    
    // Get all admins
    const admins = await prisma.adminUser.findMany({ include: { role: true } });
    console.log(`Found ${admins.length} admin(s)`);
    
    // Update first admin to owner role
    if (admins.length > 0) {
        const admin = admins[0];
        await prisma.adminUser.update({
            where: { id: admin.id },
            data: { roleId: ownerRole.id }
        });
        console.log(`✅ Updated ${admin.email} to owner role`);
    }
    
    await prisma.$disconnect();
    console.log('Done!');
}

updateToOwner().catch(console.error);
