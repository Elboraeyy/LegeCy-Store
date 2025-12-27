
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@legacystore.com';
  console.log(`Unlocking account for ${email}...`);

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email },
    });

    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    const updated = await prisma.adminUser.update({
      where: { email },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log('Account unlocked successfully!');
    console.log('New Status:', {
      failedLoginAttempts: updated.failedLoginAttempts,
      lockedUntil: updated.lockedUntil,
    });
  } catch (error) {
    console.error('Error unlocking account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
