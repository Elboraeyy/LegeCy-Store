import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 0. Seed Enums
  const orderStatuses = ['pending', 'paid', 'shipped', 'cancelled'];
  for (const status of orderStatuses) {
    await prisma.orderStatusEnum.upsert({
      where: { value: status },
      update: {},
      create: { value: status },
    });
  }
  console.log('📋 OrderStatusEnum seeded.');

  const paymentStatuses = ['pending', 'succeeded', 'failed', 'expired'];
  for (const status of paymentStatuses) {
    await prisma.paymentIntentStatusEnum.upsert({
      where: { value: status },
      update: {},
      create: { value: status },
    });
  }
  console.log('💳 PaymentIntentStatusEnum seeded.');

  // 1. Create Default Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { name: 'Main Warehouse' },
    update: {},
    create: {
      name: 'Main Warehouse',
    },
  });
  console.log('📦 Warehouse ensured:', warehouse.name);

  // 2. Create Demo Product
  const sku = 'DEMO-SKU-001';
  let variant = await prisma.variant.findUnique({
      where: { sku },
      include: { product: true }
  });

  let product;

  if (variant) {
      product = variant.product;
      console.log(`🔄 Product already exists: ${product.name} (SKU: ${sku})`);
  } else {
      product = await prisma.product.create({
        data: {
            name: 'Professional Demo Product',
            description: 'A product to test inventory reservation logic.',
            variants: {
                create: {
                    sku,
                    price: 199.99,
                    inventory: {
                        create: {
                            warehouseId: warehouse.id,
                            available: 100,
                            reserved: 0
                        }
                    }
                }
            }
        },
        include: {
            variants: {
                include: {
                    product: true
                }
            }
        }
      });
      variant = product.variants[0];
      console.log(`👕 Created Product: ${product.name} with Variant SKU: ${variant.sku}`);
  }
  
  if (variant) {
      console.log(`📊 Inventory verified for ${variant.sku}`);
  }

  // 3. Seed Admin Roles
  const adminRoles = [
      { 
        name: 'super_admin', 
        description: 'Full access to all resources',
        permissions: 'ALL' 
      },
      { 
        name: 'admin', 
        description: 'Standard admin access',
        permissions: 'ORDERS_READ,ORDERS_MANAGE,INVENTORY_MANAGE' 
      },
      { 
        name: 'support', 
        description: 'Support access only',
        permissions: 'ORDERS_READ' 
      },
      { 
        name: 'manager', 
        description: 'Manager access with order and inventory management',
        permissions: 'ORDERS_READ,ORDERS_MANAGE,INVENTORY_MANAGE' 
      }
  ];

  for (const role of adminRoles) {
      await prisma.adminRole.upsert({
          where: { name: role.name },
          update: {},
          create: role
      });
  }
  console.log('🛡️ Admin Roles seeded.');

  // 4. Create Super Admin
  const adminEmail = 'admin@legecy.store';
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  
  if (!existingAdmin) {
    const { hashPassword } = await import('../src/lib/auth/password');
    const hashedPassword = await hashPassword('Admin123!');
    
    // Fetch role to connect
    const superRole = await prisma.adminRole.findUnique({ where: { name: 'super_admin' } });
    
    if (superRole) {
        await prisma.adminUser.create({
          data: {
            email: adminEmail,
            name: 'Super Admin',
            passwordHash: hashedPassword,
            roleId: superRole.id
          }
        });
        console.log('🛡️ Super Admin created: admin@legecy.store / Admin123!');
    }
  } else {
    // Ensure existing super admin has the role (Migration backfill support)
    const superRole = await prisma.adminRole.findUnique({ where: { name: 'super_admin' } });
    if (superRole && !existingAdmin.roleId) {
        await prisma.adminUser.update({
            where: { id: existingAdmin.id },
            data: { roleId: superRole.id }
        });
        console.log('🛡️ Super Admin role backfilled.');
    }
    console.log('🛡️ Super Admin verified.');
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
