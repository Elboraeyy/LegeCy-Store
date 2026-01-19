import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOwner() {
  console.log('🔐 Creating Owner Admin Account...');
  
  const email = 'elboraey@legacy.store';
  const password = 'Legacy@22';
  const name = 'El Boraey';
  
  // Check if user already exists
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });
  
  if (existingAdmin) {
    console.log('⚠️ Admin with this email already exists. Updating password and role...');
    
    const { hashPassword } = await import('../src/lib/auth/password');
    const hashedPassword = await hashPassword(password);
    
    const ownerRole = await prisma.adminRole.findUnique({ where: { name: 'owner' } });
    
    await prisma.adminUser.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash: hashedPassword,
        roleId: ownerRole?.id,
        name: name
      }
    });
    
    console.log('✅ Admin account updated successfully!');
  } else {
    // Create new admin
    const { hashPassword } = await import('../src/lib/auth/password');
    const hashedPassword = await hashPassword(password);
    
    // Fetch owner role
    const ownerRole = await prisma.adminRole.findUnique({ where: { name: 'owner' } });
    
    if (!ownerRole) {
      // Create owner role if it doesn't exist
      console.log('📋 Creating owner role...');
      await prisma.adminRole.create({
        data: {
          name: 'owner',
          description: 'Store owner with full access',
          permissions: 'ALL'
        }
      });
    }
    
    const finalOwnerRole = await prisma.adminRole.findUnique({ where: { name: 'owner' } });
    
    await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword,
        roleId: finalOwnerRole!.id
      }
    });
    
    console.log('✅ Owner Admin created successfully!');
  }
  
  console.log(`\n📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`👑 Role: Owner (Full Access)`);
}

createOwner()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
