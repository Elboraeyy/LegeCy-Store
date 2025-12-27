
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@legacystore.com';
  console.log(`Checking account for ${email}...`);

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    // Note: failedLoginAttempts and lockedUntil fields no longer exist in schema
    // Simply activate the user if needed
    const updated = await prisma.adminUser.update({
      where: { email },
      data: {
        isActive: true,
      },
    });

    console.log('Account status:', {
      id: updated.id,
      email: updated.email,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
