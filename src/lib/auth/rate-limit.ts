/**
 * Simple in-memory rate limiter.
 * In a distributed environment (serverless/multiple pods), this should be replaced with Redis.
 */
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export const RateLimits = {
    ADMIN_LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 mins
    CUSTOMER_LOGIN: { limit: 10, windowMs: 15 * 60 * 1000 }, // 10 attempts per 15 mins
    SIGNUP: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    API_STRICT: { limit: 60, windowMs: 60 * 1000 }, // 60 per min
    API_STANDARD: { limit: 100, windowMs: 60 * 1000 }, // 100 per min
} as const;

export type RateLimitConfig = { limit: number; windowMs: number };

/**
 * Checks a rate limit for a specific identifier (IP or User ID).
 * Returns TRUE if allowed, FALSE if blocked.
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = rateLimits.get(identifier);

    if (!record) {
        rateLimits.set(identifier, { count: 1, expiresAt: now + config.windowMs });
        return true;
    }

    // Expired? Reset.
    if (now > record.expiresAt) {
        rateLimits.set(identifier, { count: 1, expiresAt: now + config.windowMs });
        return true;
    }

    // Limit exceeded?
    if (record.count >= config.limit) {
        return false;
    }

    record.count++;
    return true;
}

/**
 * Cleanup interval to prevent memory leaks from old IPs.
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimits.entries()) {
        if (now > val.expiresAt) {
            rateLimits.delete(key);
        }
    }
}, 60 * 60 * 1000); // Check every hour
