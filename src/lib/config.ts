import { z } from 'zod';

/**
 * CENTRAL CONFIGURATION MODULE
 * 
 * RULES:
 * 1. ALL env access MUST go through this module
 * 2. App CRASHES on startup if config is invalid
 * 3. Never import process.env directly elsewhere
 */

const envSchema = z.object({
    // Node Environment
    NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
    
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    
    // Session Secrets
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
    ADMIN_SESSION_SECRET: z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters').optional(),
    
    // Payment Provider (Paymob)
    PAYMOB_API_KEY: z.string().optional(),
    PAYMOB_HMAC_SECRET: z.string().optional(),
    PAYMOB_INTEGRATION_ID: z.string().optional(),
    PAYMOB_IFRAME_ID: z.string().optional(),
    
    // Operational Config
    RESERVATION_TTL_MINUTES: z.string().transform(Number).pipe(z.number().min(1).max(60)).optional(),
    ZOMBIE_THRESHOLD_MINUTES: z.string().transform(Number).pipe(z.number().min(10).max(120)).optional(),
    
    // Logging
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).optional(),
});

// Parse and validate environment
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    
    if (!result.success) {
        console.error('❌ Invalid environment configuration:');
        result.error.issues.forEach(issue => {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        });
        
        // In production, crash immediately
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Invalid environment configuration. Cannot start in production.');
        }
        
        // In development, warn but continue with defaults
        console.warn('⚠️ Running with potentially invalid config in development mode');
    }
    
    return result.success ? result.data : getDefaultConfig();
}

function getDefaultConfig() {
    return {
        NODE_ENV: 'development' as const,
        DATABASE_URL: 'file:./prisma/dev.db',
        SESSION_SECRET: undefined,
        ADMIN_SESSION_SECRET: undefined,
        PAYMOB_API_KEY: undefined,
        PAYMOB_HMAC_SECRET: undefined,
        PAYMOB_INTEGRATION_ID: undefined,
        PAYMOB_IFRAME_ID: undefined,
        RESERVATION_TTL_MINUTES: 15,
        ZOMBIE_THRESHOLD_MINUTES: 30,
        LOG_LEVEL: 'info' as const,
        RATE_LIMIT_WINDOW_MS: 60000,
    };
}

// Validated config singleton
const env = validateEnv();

// Export typed config
export const config = {
    // Environment
    isDev: env.NODE_ENV === 'development',
    isStaging: env.NODE_ENV === 'staging',
    isProd: env.NODE_ENV === 'production',
    nodeEnv: env.NODE_ENV,
    
    // Database
    databaseUrl: env.DATABASE_URL,
    
    // Session
    sessionSecret: env.SESSION_SECRET,
    adminSessionSecret: env.ADMIN_SESSION_SECRET,
    
    // Payment
    paymob: {
        apiKey: env.PAYMOB_API_KEY,
        hmacSecret: env.PAYMOB_HMAC_SECRET,
        integrationId: env.PAYMOB_INTEGRATION_ID,
        walletIntegrationId: process.env.PAYMOB_WALLET_INTEGRATION_ID,
        iframeId: env.PAYMOB_IFRAME_ID,
        isConfigured: !!(env.PAYMOB_API_KEY && env.PAYMOB_HMAC_SECRET),
    },
    
    // Operational
    reservationTtlMinutes: env.RESERVATION_TTL_MINUTES ?? 15,
    zombieThresholdMinutes: env.ZOMBIE_THRESHOLD_MINUTES ?? 30,
    
    // Logging
    logLevel: env.LOG_LEVEL,
    
    // Rate Limiting
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS ?? 60000,
} as const;

// Type export
export type Config = typeof config;

// Validate critical config in production
export function validateProductionConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (config.isProd) {
        if (!config.sessionSecret) issues.push('SESSION_SECRET is required in production');
        if (!config.adminSessionSecret) issues.push('ADMIN_SESSION_SECRET is required in production');
        if (!config.paymob.isConfigured) issues.push('Paymob credentials required in production');
    }
    
    return { valid: issues.length === 0, issues };
}
