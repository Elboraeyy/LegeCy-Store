import { PrismaClient, SafeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Financial Clean-Slate Migration...');

  // --- رأس المال (Capital) ---
  const INITIAL_CAPITAL = 41000; 

  // 1. Create Default Safes if they don't exist
  console.log('\n📦 Setting up Safes (Treasuries)...');
  const defaultSafes = [
    { name: 'Bank Account (CIB)', type: SafeType.BANK, balance: 0 },
    { name: 'Cash (Office)', type: SafeType.CASH, balance: INITIAL_CAPITAL }, // رأس المال هنا
    { name: 'InstaPay / E-Wallets', type: SafeType.WALLET, balance: 0 },
  ];

  for (const safeData of defaultSafes) {
    const existing = await prisma.safe.findFirst({
      where: { name: safeData.name },
    });

    if (!existing) {
      await prisma.safe.create({ data: safeData });
      console.log(`✅ Created Safe: ${safeData.name} with balance ${safeData.balance}`);
    } else {
      if (safeData.name === 'Cash (Office)') {
        await prisma.safe.update({
          where: { id: existing.id },
          data: { balance: INITIAL_CAPITAL }
        });
        console.log(`✅ Updated Cash Safe balance to: ${INITIAL_CAPITAL}`);
      } else {
        console.log(`ℹ️ Safe already exists: ${safeData.name}`);
      }
    }
  }

  // 2. Setup Partner Profiles based on Cap Table
  console.log('\n👥 Setting up Partner Profiles...');
  
  // بيانات الشركاء من صورة الـ Cap Table
  // نسبة الرواتب (salaryShare) موزعة بالتساوي (1/8) على جميع الشركاء الـ 8
  const salarySharePerActive = 1.0 / 8.0; 

  const partners = [
    { name: 'Mohamed Samy', email: 'mohamed@legecy.store', password: 'password123', profitShare: 13000/41000, salaryShare: salarySharePerActive, contributed: 13000 },
    { name: 'Ahmed Mahmoud', email: 'ahmed@legecy.store', password: 'password123', profitShare: 10000/41000, salaryShare: salarySharePerActive, contributed: 10000 },
    { name: 'Yousef Hany', email: 'yousef@legecy.store', password: 'password123', profitShare: 6000/41000, salaryShare: salarySharePerActive, contributed: 6000 },
    { name: 'Ezzat Hussen', email: 'ezzat@legecy.store', password: 'password123', profitShare: 3000/41000, salaryShare: salarySharePerActive, contributed: 3000 },
    { name: 'Kareem Elboraey', email: 'kareem@legecy.store', password: 'password123', profitShare: 3000/41000, salaryShare: salarySharePerActive, contributed: 3000 },
    { name: 'Ehab Tarek', email: 'ehab@legecy.store', password: 'password123', profitShare: 3000/41000, salaryShare: salarySharePerActive, contributed: 3000 },
    { name: 'Malek Khalifa', email: 'malek@legecy.store', password: 'password123', profitShare: 3000/41000, salaryShare: salarySharePerActive, contributed: 3000 },
    { name: 'Moataz Mohamed', email: 'moataz@legecy.store', password: 'password123', profitShare: 0, salaryShare: salarySharePerActive, contributed: 0 },
  ];

  // Get Admin Roles
  const superAdminRole = await prisma.adminRole.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const adminRole = await prisma.adminRole.findUnique({ where: { name: 'ADMIN' } });

  for (const p of partners) {
    let admin = await prisma.adminUser.findUnique({ 
      where: { email: p.email },
      include: { investorProfile: true }
    });
    
    if (!admin) {
      const assignedRole = p.name === 'Mohamed Samy' ? superAdminRole : adminRole;
      admin = await prisma.adminUser.create({
        data: {
          name: p.name,
          email: p.email,
          passwordHash: p.password, 
          roleId: assignedRole?.id, 
        },
        include: { investorProfile: true }
      });
      console.log(`✅ Created Admin login for: ${p.name}`);
    }

    if (!admin.investorProfile) {
      await prisma.investor.create({
        data: {
          name: p.name,
          netContributed: p.contributed,
          currentShare: p.profitShare, 
          salaryShare: p.salaryShare,
          walletBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0,
          adminUser: { connect: { id: admin.id } }
        }
      });
      console.log(`✅ Created Partner Profile (Wallet) for: ${p.name} (Ownership: ${(p.profitShare * 100).toFixed(1)}%)`);
    } else {
      console.log(`ℹ️ Partner Profile already exists for: ${p.name}`);
    }
  }

  console.log('\n🎉 Migration Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
