import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('&channel_binding=require', '')
    }
  }
});

async function enablePaymob() {
  console.log('🔍 Checking current kill switches...\n');
  
  // Get current kill switches
  const killSwitchConfig = await prisma.storeConfig.findUnique({
    where: { key: 'system_kill_switches' }
  });
  
  console.log('📋 Current Kill Switches:');
  console.log(JSON.stringify(killSwitchConfig?.value, null, 2));
  
  // Get current payment settings
  const paymentConfig = await prisma.storeConfig.findUnique({
    where: { key: 'payment_settings' }
  });
  
  console.log('\n💳 Current Payment Settings:');
  console.log(JSON.stringify(paymentConfig?.value, null, 2));
  
  // Enable Paymob in kill switches
  const currentSwitches = (killSwitchConfig?.value as Record<string, boolean>) || {};
  const newSwitches = {
    ...currentSwitches,
    payments_enabled: true,
    paymob_enabled: true,
  };
  
  await prisma.storeConfig.upsert({
    where: { key: 'system_kill_switches' },
    update: { value: newSwitches },
    create: { key: 'system_kill_switches', value: newSwitches }
  });
  
  console.log('\n✅ Kill Switches Updated:');
  console.log(JSON.stringify(newSwitches, null, 2));
  
  // Enable Paymob in payment settings
  const currentPayment = (paymentConfig?.value as Record<string, boolean>) || {};
  const newPayment = {
    ...currentPayment,
    enableCOD: true,
    enablePaymob: true,
  };
  
  await prisma.storeConfig.upsert({
    where: { key: 'payment_settings' },
    update: { value: newPayment },
    create: { key: 'payment_settings', value: newPayment }
  });
  
  console.log('\n✅ Payment Settings Updated:');
  console.log(JSON.stringify(newPayment, null, 2));
  
  console.log('\n🎉 Paymob is now ENABLED!');
}

enablePaymob()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
