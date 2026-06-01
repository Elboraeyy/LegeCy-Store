import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BRANDS ===');
  const brands = await prisma.brand.findMany();
  for (const b of brands) {
    console.log(`ID: ${b.id}, Name: ${b.name}, Slug: ${b.slug}`);
  }

  console.log('\n=== INVESTORS ===');
  const investors = await prisma.investor.findMany();
  for (const inv of investors) {
    console.log(`ID: ${inv.id}, Name: ${inv.name}, Share: ${inv.currentShare.toNumber()}, Salary Share: ${inv.salaryShare.toNumber()}, Wallet: ${inv.walletBalance.toNumber()}, Type: ${inv.type}`);
  }

  console.log('\n=== PARTNERS ===');
  const partners = await prisma.partner.findMany();
  for (const p of partners) {
    console.log(`ID: ${p.id}, Name: ${p.name}, Code: ${p.code}, Wallet: ${p.walletBalance.toNumber()}, Rate: ${p.commissionRate.toNumber()}`);
  }

  console.log('\n=== SAFES ===');
  const safes = await prisma.safe.findMany();
  for (const s of safes) {
    console.log(`ID: ${s.id}, Name: ${s.name}, Balance: ${s.balance.toNumber()}, Type: ${s.type}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
