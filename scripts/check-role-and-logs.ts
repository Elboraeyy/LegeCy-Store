
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking Roles ---');
  const roles = await prisma.adminRole.findMany();
  console.log('Available Roles:', roles.map(r => r.name));

  const ownerRole = roles.find(r => r.name.toLowerCase() === 'owner');
  
  if (ownerRole) {
      console.log(`\n'owner' role found (ID: ${ownerRole.id}). Updating user...`);
      await prisma.adminUser.update({
          where: { email: 'elboraey@legacy.store' },
          data: { roleId: ownerRole.id }
      });
      console.log('User role updated to owner.');
  } else {
      console.log(`\n'owner' role NOT found. You may need to create it.`);
      // Check if we should create it or if 'super_admin' is effectively owner
  }

  console.log('\n--- Checking Audit Logs for Deletion ---');
  // Look for logs related to this user being deleted
  // We search for "DELETE_ADMIN" or similar actions, or metadata containing the email
  const logs = await prisma.auditLog.findMany({
      where: {
          OR: [
              { action: { contains: 'DELETE' } },
              { metadata: { contains: 'elboraey@legacy.store' } }
          ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: true }
  });

  if (logs.length === 0) {
      console.log('No relevant deletion logs found.');
  } else {
      logs.forEach(log => {
          console.log(`[${log.createdAt.toISOString()}] Action: ${log.action} by ${log.admin?.email} - Meta: ${log.metadata}`);
      });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
