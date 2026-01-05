import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('&channel_binding=require', '')
    }
  }
});

async function checkPaymentStatus() {
  console.log('🔍 Checking Payment Status...\n');
  
  // 1. Check Kill Switches
  const killSwitchConfig = await prisma.storeConfig.findUnique({
    where: { key: 'system_kill_switches' }
  });
  
  // 2. Check Payment Settings
  const paymentConfig = await prisma.storeConfig.findUnique({
    where: { key: 'payment_settings' }
  });
  
  // 3. Simulate Logic
  const switches = (killSwitchConfig?.value || { payments_enabled: true, paymob_enabled: false }) as { payments_enabled: boolean; paymob_enabled: boolean };
  const settings = (paymentConfig?.value || {}) as { enablePaymob?: boolean; testMode?: boolean };
  
  console.log('--------------------------------------------------');
  console.log(`[KillSwitch] payments_enabled: ${switches.payments_enabled}`);
  console.log(`[KillSwitch] paymob_enabled:   ${switches.paymob_enabled}`);
  console.log(`[Settings]   enablePaymob:     ${settings.enablePaymob}`);
  console.log(`[Settings]   testMode:         ${settings.testMode}`);
  
  const isMasterEnabled = switches.payments_enabled;
  const isPaymobEnabled = switches.paymob_enabled || (settings.enablePaymob === true);
  
  console.log('--------------------------------------------------');
  console.log(`Final Paymob Status: ${isMasterEnabled && isPaymobEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
}

checkPaymentStatus()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
