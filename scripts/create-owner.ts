
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return await hash(password, {
        timeCost: 2,
        memoryCost: 19456,
        parallelism: 1
    });
}

async function main() {
  console.log('--- Creating Owner Admin User ---');

  const email = 'elboraey@legacy.store';
  const name = 'Elboraey'; // Assuming name based on email
  const password = 'Password@123'; // Temporary strong password
  
  // 1. Check if user already exists (just in case)
  const existingUser = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User '${email}' already exists. Updating password...`);
    const passwordHash = await hashPassword(password);
    await prisma.adminUser.update({
        where: { email },
        data: {
            passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
            isActive: true
        }
    });
    console.log('Password updated and account unlocked.');
    return;
  }

  // 2. Find Super Admin Role
  const role = await prisma.adminRole.findUnique({
      where: { name: 'super_admin' }
  });

  if (!role) {
      console.error('Role super_admin not found! Cannot create user.');
      process.exit(1);
  }

  // 3. Create User
  const passwordHash = await hashPassword(password);
  
  const user = await prisma.adminUser.create({
      data: {
          email,
          name,
          username: 'Owner',
          passwordHash,
          roleId: role.id,
          isActive: true
      }
  });

  console.log(`\nUser '${email}' created successfully!`);
  console.log(`ID: ${user.id}`);
  console.log(`Role: ${role.name}`);
  console.log(`Temporary Password: ${password}`);
  console.log('Please login and change the password immediately.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
