import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a random fallback for development or when Redis is missing
// to prevent crashing.
let ratelimit: Ratelimit | null = null;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10s
            analytics: true,
            prefix: '@upstash/ratelimit',
        });
    } else {
        console.warn('[RateLimit] UPSTASH_REDIS_REST_URL/TOKEN not found. Rate limiting is disabled (or local).');
    }
} catch (error) {
    console.error('[RateLimit] Failed to initialize', error);
}

export const rateLimiter = {
    /**
     * Check if identifier is rate limited
     * @param identifier IP or User ID
     * @returns { success: boolean, reset: number, remaining: number }
     */
    async limit(identifier: string) {
        if (!ratelimit) {
            // Mock for dev / missing env
            return { success: true, limit: 10, remaining: 9, reset: Date.now() + 10000 };
        }

        try {
            return await ratelimit.limit(identifier);
        } catch (error) {
            console.error(`[RateLimit] Error checking limit for ${identifier}`, error);
            // Fail open (allow request) if redis is down
            return { success: true, limit: 10, remaining: 1, reset: Date.now() + 10000 };
        }
    }
};
