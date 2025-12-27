

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('--- Inspecting Admin Users ---');

  const targetEmail = 'elboraey@legacy.store';
  
  // Retry loop for connection
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxRetries} to connect...`);
      
      // 1. Check specific user
      const user = await prisma.adminUser.findUnique({
        where: { email: targetEmail },
        include: { role: true }
      });

      if (user) {
        console.log(`\nUser '${targetEmail}' FOUND:`);
        console.log(`- ID: ${user.id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Role: ${user.role?.name || 'No Role'}`);
        console.log(`- Is Active: ${user.isActive}`);
      } else {
        console.log(`\nUser '${targetEmail}' NOT FOUND.`);
      }

      // 2. List all admins
      console.log('\n--- All Admin Users ---');
      const allAdmins = await prisma.adminUser.findMany({
        include: { role: true }
      });

      allAdmins.forEach(admin => {
        console.log(`[${admin.email}] (${admin.role?.name || 'No Role'})`);
      });
      
      // If successful, break the loop
      break;

    } catch (e: any) {
      console.error(`Error on attempt ${i + 1}:`, e.message);
      if (i === maxRetries - 1) throw e;
      console.log('Retrying in 2 seconds...');
      await wait(2000);
    }
  }
}

main()
  .catch((e) => {
    console.error('Final failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

