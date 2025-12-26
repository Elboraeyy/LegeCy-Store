import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../src/lib/auth/password';

const prisma = new PrismaClient();

async function main() {
    console.log('🔐 Starting Auth Verification...');
    
    // 1. Test Password Hashing
    console.log('\n🧪 Test 1: Password Strength');
    const pass = 'superSecret123!';
    const hash = await hashPassword(pass);
    if (!hash.startsWith('$argon2')) throw new Error('Password not hashed with Argon2');
    if (!(await verifyPassword(pass, hash))) throw new Error('Password verification failed');
    console.log('✅ Hashing works.');

    // 2. Test Isolation (DB Level)
    console.log('\n🧪 Test 2: Domain Isolation');
    const adminEmail = 'testadmin@verify.com';
    const userEmail = 'testuser@verify.com';
    
    // Cleanup
    await prisma.adminUser.deleteMany({ where: { email: adminEmail } });
    await prisma.user.deleteMany({ where: { email: userEmail } });

    // Create Admin
    const adminRole = await prisma.adminRole.findUnique({ where: { name: 'admin' } });
    if (!adminRole) throw new Error('Admin role not seeded');

    await prisma.adminUser.create({
        data: {
            email: adminEmail,
            name: 'Test Admin',
            passwordHash: await hashPassword(pass),
            role: { connect: { id: adminRole.id } }
        }
    });

    // Create User
    await prisma.user.create({
        data: {
            email: userEmail,
            passwordHash: await hashPassword(pass),
            name: 'Test User'
        }
    });

    // Verify no cross-pollination
    const foundUserAsAdmin = await prisma.adminUser.findUnique({ where: { email: userEmail } });
    if (foundUserAsAdmin) throw new Error('❌ FAILURE: Customer found in Admin table!');
    
    const foundAdminAsUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (foundAdminAsUser) throw new Error('❌ FAILURE: Admin found in Customer table!');

    console.log('✅ Tables are strictly isolated.');

    console.log('🎉 Auth Logic Verification Passed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
