/**
 * Production Hardening Verification Tests
 * 
 * Run with: npx ts-node tests/verify-hardening.ts
 * 
 * These tests verify that all production hardening measures are in place.
 */

import { validateProductionSecrets } from '../src/lib/env-validator';
import { ledgerBalances, validateJournalBalance } from '../src/lib/decimal-utils';

// Color codes for terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function pass(msg: string) {
  console.log(`${GREEN}✅ PASS${RESET}: ${msg}`);
}

function fail(msg: string) {
  console.log(`${RED}❌ FAIL${RESET}: ${msg}`);
  process.exitCode = 1;
}

function warn(msg: string) {
  console.log(`${YELLOW}⚠️ WARN${RESET}: ${msg}`);
}

async function main() {
  console.log('\n🔒 Production Hardening Verification\n');
  console.log('='.repeat(50));
  
  // =============================================
  // TEST 1: Secret Validation
  // =============================================
  console.log('\n📋 Test 1: Secret Validation Logic\n');
  
  const secretResult = validateProductionSecrets();
  
  if (secretResult.forbidden.length > 0) {
    fail(`Forbidden secrets detected: ${secretResult.forbidden.join(', ')}`);
  } else {
    pass('No forbidden NEXT_PUBLIC_ secrets detected');
  }
  
  if (process.env.NEXT_PUBLIC_ADMIN_SECRET) {
    fail('NEXT_PUBLIC_ADMIN_SECRET is still present - REMOVE IMMEDIATELY');
  } else {
    pass('NEXT_PUBLIC_ADMIN_SECRET is not exposed');
  }
  
  // =============================================
  // TEST 2: Ledger Balance Verification
  // =============================================
  console.log('\n📋 Test 2: Ledger Balance (Exact Math)\n');
  
  // Test exact equality
  if (ledgerBalances(100.00, 100.00)) {
    pass('Exact equality: 100.00 === 100.00');
  } else {
    fail('Exact equality failed');
  }
  
  // Test that floating-point quirks don't cause issues
  // 0.1 + 0.2 !== 0.3 in IEEE 754 float
  if (ledgerBalances(0.1 + 0.2, 0.3)) {
    pass('Float handling: 0.1 + 0.2 === 0.3 (via Decimal)');
  } else {
    fail('Decimal handling failed for float edge case');
  }
  
  // Test journal validation
  try {
    validateJournalBalance([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 100 }
    ]);
    pass('Journal validation: Balanced entry passes');
  } catch (e) {
    fail(`Journal validation: Balanced entry threw: ${e}`);
  }
  
  try {
    validateJournalBalance([
      { debit: 100, credit: 0 },
      { debit: 0, credit: 99.99 }
    ]);
    fail('Journal validation: Unbalanced entry should have thrown');
  } catch {
    pass('Journal validation: Unbalanced entry rejected');
  }
  
  // =============================================
  // TEST 3: Rate Limit Configuration
  // =============================================
  console.log('\n📋 Test 3: Rate Limit Configuration\n');
  
  const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  
  if (hasUpstash) {
    pass('Upstash Redis configured for distributed rate limiting');
  } else if (process.env.NODE_ENV === 'production') {
    fail('Upstash NOT configured - rate limiting will BLOCK critical endpoints');
  } else {
    warn('Upstash not configured (OK for development)');
  }
  
  // =============================================
  // TEST 4: Payment Configuration
  // =============================================
  console.log('\n📋 Test 4: Payment Security Configuration\n');
  
  const hasPaymobHmac = !!process.env.PAYMOB_HMAC_SECRET;
  if (hasPaymobHmac) {
    pass('Paymob HMAC secret configured (webhook verification enabled)');
  } else {
    fail('Paymob HMAC secret NOT configured - ALL webhooks will be REJECTED');
  }
  
  const hasPaymobApi = !!process.env.PAYMOB_API_KEY;
  if (hasPaymobApi) {
    pass('Paymob API key configured');
  } else {
    fail('Paymob API key NOT configured');
  }
  
  // =============================================
  // TEST 5: Cron Security
  // =============================================
  console.log('\n📋 Test 5: Cron Security Configuration\n');
  
  const hasCronSecret = !!process.env.CRON_SECRET;
  if (hasCronSecret) {
    pass('Cron secret configured');
  } else {
    warn('Cron secret not configured - cron jobs may fail in production');
  }
  
  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n' + '='.repeat(50));
  console.log(`\n${process.exitCode === 1 ? RED + '❌ VERIFICATION FAILED' : GREEN + '✅ VERIFICATION PASSED'}${RESET}`);
  console.log('\nRun all tests before deploying to production.\n');
}

main().catch(console.error);
