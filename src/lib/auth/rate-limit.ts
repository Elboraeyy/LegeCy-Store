/**
 * Rate Limiting Service
 * 
 * Uses Upstash Redis in production for distributed rate limiting.
 * Falls back to in-memory for local development.
 */

// ============================================
// RATE LIMIT CONFIGURATIONS
// ============================================

export const RateLimits = {
    ADMIN_LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },    // 5 attempts per 15 mins
    CUSTOMER_LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 mins
    SIGNUP: { limit: 3, windowMs: 60 * 60 * 1000 },          // 3 per hour
    CHECKOUT: { limit: 10, windowMs: 60 * 1000 },            // 10 per minute
    API_STRICT: { limit: 60, windowMs: 60 * 1000 },          // 60 per min
    API_STANDARD: { limit: 100, windowMs: 60 * 1000 },       // 100 per min
    PAYMENT_INIT: { limit: 5, windowMs: 60 * 1000 },         // 5 per minute
} as const;

export type RateLimitConfig = { limit: number; windowMs: number };
export type RateLimitResult = { 
  allowed: boolean; 
  remaining: number; 
  resetAt: number;
};

// ============================================
// UPSTASH REDIS SETUP
// ============================================

let upstashRatelimit: ReturnType<typeof createUpstashRatelimit> | null = null;

async function getUpstashRatelimit() {
  if (upstashRatelimit) return upstashRatelimit;
  
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (upstashUrl && upstashToken) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      
      const redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
      
      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // Default, overridden per-call
        analytics: true,
      });
      
      console.log('✅ Upstash rate limiting initialized');
      return upstashRatelimit;
    } catch (e) {
      console.warn('⚠️ Failed to initialize Upstash, falling back to memory:', e);
    }
  }
  
  return null;
}

function createUpstashRatelimit() {
  return null as unknown as { limit: (identifier: string) => Promise<{ success: boolean; remaining: number; reset: number }> };
}

// ============================================
// IN-MEMORY FALLBACK (Development)
// ============================================

const memoryStore = new Map<string, { count: number; expiresAt: number }>();

function checkMemoryRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}:${config.limit}:${config.windowMs}`;
  const record = memoryStore.get(key);

  if (!record || now > record.expiresAt) {
    memoryStore.set(key, { count: 1, expiresAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (record.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: record.expiresAt };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: config.limit - record.count, 
    resetAt: record.expiresAt 
  };
}

// Cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of memoryStore.entries()) {
      if (now > val.expiresAt) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

// ============================================
// MAIN RATE LIMIT FUNCTION
// ============================================

/**
 * Check rate limit for an identifier.
 * Uses Upstash in production, memory in development.
 * 
 * @returns RateLimitResult with allowed status and remaining count
 */
export async function checkRateLimitAsync(
  identifier: string, 
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Try Upstash first
  const upstash = await getUpstashRatelimit();
  
  if (upstash) {
    try {
      // Dynamic limiter based on config
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      
      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(config.limit, `${config.windowMs}ms`),
      });
      
      const result = await limiter.limit(identifier);
      
      // Track breaches for alerting
      if (!result.success) {
        const { trackRateLimitBreach } = await import('@/lib/monitoring');
        await trackRateLimitBreach(identifier, 'rate_limit', result.remaining);
      }
      
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (e) {
      console.error('Upstash rate limit check failed:', e);
      // Fallback to memory on error
    }
  }
  
  // Fallback to memory
  const result = checkMemoryRateLimit(identifier, config);
  
  // Track breaches
  if (!result.allowed) {
    try {
      const { trackRateLimitBreach } = await import('@/lib/monitoring');
      await trackRateLimitBreach(identifier, 'rate_limit', result.remaining);
    } catch {
      // Ignore monitoring errors
    }
  }
  
  return result;
}

/**
 * Synchronous rate limit check (memory-only, for backward compatibility)
 * Returns TRUE if allowed, FALSE if blocked.
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const result = checkMemoryRateLimit(identifier, config);
  return result.allowed;
}

/**
 * Check if Upstash is configured
 */
export function isDistributedRateLimitingEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

