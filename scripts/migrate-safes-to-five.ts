import { PrismaClient, SafeType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== MIGRATING SAFES TO THE 5 SPECIFIED ENGLISH ACCOUNTS ===');

  // 1. Rename existing 'Cash (Office)' to 'Cash'
  const cashSafe = await prisma.safe.findFirst({ where: { name: { in: ['Cash (Office)', 'كاش'] } } });
  if (cashSafe) {
    await prisma.safe.update({
      where: { id: cashSafe.id },
      data: { name: 'Cash' }
    });
    console.log(`✅ Renamed ${cashSafe.name} to Cash`);
  } else {
    const existingCash = await prisma.safe.findUnique({ where: { name: 'Cash' } });
    if (!existingCash) {
      await prisma.safe.create({
        data: {
          name: 'Cash',
          type: SafeType.CASH,
          balance: 0,
          description: 'Cash account'
        }
      });
      console.log('✅ Created Cash safe');
    } else {
      console.log('ℹ️ Cash safe already exists');
    }
  }

  // 2. Rename existing 'Bank Account (CIB)' to 'Bank Account (NBE)'
  const cibSafe = await prisma.safe.findFirst({ where: { name: { in: ['Bank Account (CIB)', 'حساب بنكي بنك اهلي'] } } });
  if (cibSafe) {
    await prisma.safe.update({
      where: { id: cibSafe.id },
      data: { name: 'Bank Account (NBE)' }
    });
    console.log(`✅ Renamed ${cibSafe.name} to Bank Account (NBE)`);
  } else {
    const existingNbe = await prisma.safe.findUnique({ where: { name: 'Bank Account (NBE)' } });
    if (!existingNbe) {
      await prisma.safe.create({
        data: {
          name: 'Bank Account (NBE)',
          type: SafeType.BANK,
          balance: 0,
          description: 'National Bank of Egypt'
        }
      });
      console.log('✅ Created Bank Account (NBE) safe');
    } else {
      console.log('ℹ️ Bank Account (NBE) safe already exists');
    }
  }

  // 3. Rename existing 'InstaPay / E-Wallets' to 'E-Wallet'
  const walletSafe = await prisma.safe.findFirst({ where: { name: { in: ['InstaPay / E-Wallets', 'محفظة الكترونيه'] } } });
  if (walletSafe) {
    await prisma.safe.update({
      where: { id: walletSafe.id },
      data: { name: 'E-Wallet' }
    });
    console.log(`✅ Renamed ${walletSafe.name} to E-Wallet`);
  } else {
    const existingWallet = await prisma.safe.findUnique({ where: { name: 'E-Wallet' } });
    if (!existingWallet) {
      await prisma.safe.create({
        data: {
          name: 'E-Wallet',
          type: SafeType.WALLET,
          balance: 0,
          description: 'Electronic mobile wallets'
        }
      });
      console.log('✅ Created E-Wallet safe');
    } else {
      console.log('ℹ️ E-Wallet safe already exists');
    }
  }

  // 4. Create 'Meeza Card' if it doesn't exist
  const meezaSafe = await prisma.safe.findFirst({ where: { name: { in: ['Meeza Card', 'كرت ميزا'] } } });
  if (!meezaSafe) {
    await prisma.safe.create({
      data: {
        name: 'Meeza Card',
        type: SafeType.WALLET,
        balance: 0,
        description: 'Meeza prepaid card'
      }
    });
    console.log('✅ Created Meeza Card safe');
  } else if (meezaSafe.name !== 'Meeza Card') {
    await prisma.safe.update({
      where: { id: meezaSafe.id },
      data: { name: 'Meeza Card' }
    });
    console.log(`✅ Renamed ${meezaSafe.name} to Meeza Card`);
  } else {
    console.log('ℹ️ Meeza Card safe already exists');
  }

  // 5. Create 'EasyPay Card (Egyptian Post)' if it doesn't exist
  const easyPaySafe = await prisma.safe.findFirst({ where: { name: { in: ['EasyPay Card (Egyptian Post)', 'كرت ايزي باي بتاع البريد المصري'] } } });
  if (!easyPaySafe) {
    await prisma.safe.create({
      data: {
        name: 'EasyPay Card (Egyptian Post)',
        type: SafeType.WALLET,
        balance: 0,
        description: 'Egyptian Post EasyPay card'
      }
    });
    console.log('✅ Created EasyPay Card (Egyptian Post) safe');
  } else if (easyPaySafe.name !== 'EasyPay Card (Egyptian Post)') {
    await prisma.safe.update({
      where: { id: easyPaySafe.id },
      data: { name: 'EasyPay Card (Egyptian Post)' }
    });
    console.log(`✅ Renamed ${easyPaySafe.name} to EasyPay Card (Egyptian Post)`);
  } else {
    console.log('ℹ️ EasyPay Card (Egyptian Post) safe already exists');
  }

  console.log('=== SAFE MIGRATION COMPLETED SUCCESSFULLY ===');
}

main()
  .catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
