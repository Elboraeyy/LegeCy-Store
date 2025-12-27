
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Setting up Owner Role ---');

  // 1. Get Super Admin permissions to copy (or just define all)
  const superAdmin = await prisma.adminRole.findUnique({
      where: { name: 'super_admin' }
  });

  if (!superAdmin) {
      console.log('Super admin role not found, using default permissions.');
  }

  const permissions = superAdmin?.permissions || "ORDERS_MANAGE,PRODUCTS_MANAGE,USERS_MANAGE,SETTINGS_MANAGE,DASHBOARD_VIEW,ROLES_MANAGE,ADMINS_MANAGE";

  // 2. Upsert Owner Role
  const ownerRole = await prisma.adminRole.upsert({
      where: { name: 'owner' },
      update: {
          permissions: permissions, // Ensure it has full permissions
          description: 'Store Owner with full access'
      },
      create: {
          name: 'owner',
          description: 'Store Owner with full access',
          permissions: permissions
      }
  });

  console.log(`Owner role ready (ID: ${ownerRole.id})`);

  // 3. Assign to User
  const email = 'elboraey@legacy.store';
  const user = await prisma.adminUser.findUnique({ where: { email } });

  if (user) {
      await prisma.adminUser.update({
          where: { email },
          data: { roleId: ownerRole.id }
      });
      console.log(`User '${email}' role updated to 'owner'.`);
  } else {
      console.error(`User '${email}' not found!`);
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
