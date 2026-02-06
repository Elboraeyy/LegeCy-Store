/**
 * Production Environment Validator
 * 
 * CRITICAL: This module validates that ALL required secrets are present
 * at application startup. If ANY secret is missing, the app MUST crash.
 * 
 * FAIL-CLOSED: Never allow the app to start with missing production secrets.
 */

type RequiredSecret = {
  key: string;
  description: string;
  critical: boolean; // If true, crash on missing. If false, warn.
};

const REQUIRED_SECRETS: RequiredSecret[] = [
  // Database
  { key: 'DATABASE_URL', description: 'PostgreSQL connection string', critical: true },
  
  // Authentication
  { key: 'NEXTAUTH_SECRET', description: 'NextAuth.js secret for JWT', critical: true },
  { key: 'NEXTAUTH_URL', description: 'Application URL', critical: true },
  


  
  // Email
  { key: 'RESEND_API_KEY', description: 'Resend email API key', critical: true },
  
  // Admin
  { key: 'ADMIN_SECRET', description: 'Admin authentication secret', critical: true },
  
  // Cron Jobs
  { key: 'CRON_SECRET', description: 'Cron job authentication', critical: true },
  
  // Rate Limiting (Upstash)
  { key: 'UPSTASH_REDIS_REST_URL', description: 'Upstash Redis URL', critical: true },
  { key: 'UPSTASH_REDIS_REST_TOKEN', description: 'Upstash Redis token', critical: true },
  
  // OAuth (optional but warn if missing)
  { key: 'GOOGLE_CLIENT_ID', description: 'Google OAuth client ID', critical: false },
  { key: 'GOOGLE_CLIENT_SECRET', description: 'Google OAuth secret', critical: false },
  { key: 'FACEBOOK_CLIENT_ID', description: 'Facebook OAuth client ID', critical: false },
  { key: 'FACEBOOK_CLIENT_SECRET', description: 'Facebook OAuth secret', critical: false },
];

// Secrets that should NEVER be exposed to the client
const FORBIDDEN_NEXT_PUBLIC_SECRETS = [
  'NEXT_PUBLIC_ADMIN_SECRET',
  'NEXT_PUBLIC_DATABASE_URL',
  'NEXT_PUBLIC_NEXTAUTH_SECRET',
];

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  forbidden: string[];
}

/**
 * Validates all required environment variables at startup.
 * Call this in instrumentation.ts or at app initialization.
 */
export function validateProductionSecrets(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
    forbidden: [],
  };

  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = !!process.env.VERCEL;

  // Check for required secrets
  for (const secret of REQUIRED_SECRETS) {
    const value = process.env[secret.key];
    
    if (!value || value.trim() === '') {
      if (secret.critical) {
        result.missing.push(`${secret.key}: ${secret.description}`);
        result.valid = false;
      } else {
        result.warnings.push(`${secret.key}: ${secret.description} (optional)`);
      }
    }
  }

  // Check for forbidden NEXT_PUBLIC_ secrets
  for (const forbidden of FORBIDDEN_NEXT_PUBLIC_SECRETS) {
    if (process.env[forbidden]) {
      result.forbidden.push(forbidden);
      result.valid = false;
    }
  }

  // Production-specific checks
  if (isProduction || isVercel) {
    // Ensure database URL is not localhost
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'))) {
      result.missing.push('DATABASE_URL: Cannot use localhost in production');
      result.valid = false;
    }
  }

  return result;
}

/**
 * Enforces secret validation at startup.
 * MUST be called before any other code runs.
 * 
 * In production: Crashes if secrets are missing
 * In development: Logs warnings but continues
 */
export function enforceSecretValidation(): void {
  const result = validateProductionSecrets();
  const isProduction = process.env.NODE_ENV === 'production';

  if (result.forbidden.length > 0) {
    console.error('\n🚨 CRITICAL SECURITY ERROR: Forbidden secrets detected!\n');
    console.error('The following secrets MUST NOT be exposed to the client:');
    result.forbidden.forEach(s => console.error(`  ❌ ${s}`));
    console.error('\nRemove these from your environment immediately.\n');
    
    if (isProduction) {
      throw new Error(`CRITICAL: Forbidden client-exposed secrets detected: ${result.forbidden.join(', ')}`);
    }
  }

  if (!result.valid) {
    console.error('\n🚨 CRITICAL: Missing required production secrets!\n');
    console.error('The following secrets are REQUIRED:');
    result.missing.forEach(s => console.error(`  ❌ ${s}`));
    console.error('\nApplication cannot start without these secrets.\n');
    
    if (isProduction) {
      throw new Error(`CRITICAL: Missing required production secrets: ${result.missing.map(s => s.split(':')[0]).join(', ')}`);
    } else {
      console.warn('⚠️ Continuing in development mode with missing secrets...\n');
    }
  }

  if (result.warnings.length > 0) {
    console.warn('\n⚠️ Optional secrets not configured:');
    result.warnings.forEach(s => console.warn(`  ⚡ ${s}`));
    console.warn('');
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ All production secrets validated successfully\n');
  }
}

/**
 * Get a required secret or throw.
 * Use this instead of direct process.env access for critical secrets.
 */
export function getRequiredSecret(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL: Required secret ${key} is not configured`);
  }
  return value;
}
