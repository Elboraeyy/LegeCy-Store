

/**
 * Rate Limiting Service
 * 
 * Uses Upstash Redis for distributed rate limiting in production.
 * Falls back to in-memory rate limiting if Redis not configured.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Lazy initialization to avoid errors if Redis not configured
let redisClient: Redis | null = null;
let initializationAttempted = false;

function getRedis(): Redis | null {
    if (!initializationAttempted) {
        initializationAttempted = true;
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            try {
                redisClient = Redis.fromEnv();
            } catch (e) {
                console.warn('[RateLimit] Redis initialization failed, using in-memory fallback:', e);
            }
        }
    }
    return redisClient;
}

// In-memory fallback for when Redis is not available
const memoryStore = new Map<string, { count: number; resetTime: number }>();

async function memoryRateLimit(key: string, limit: number, windowMs: number): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetTime) {
        memoryStore.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
    }

    if (record.count >= limit) {
        return { success: false, limit, remaining: 0, reset: record.resetTime };
    }

    record.count++;
    return { success: true, limit, remaining: limit - record.count, reset: record.resetTime };
}

// Rate limiters - only created if Redis is available
let checkoutLimiter: Ratelimit | null = null;
let loginLimiter: Ratelimit | null = null;
let webhookLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;

/**
 * Checkout rate limit: 10 requests per minute
 * Prevents rapid-fire checkout attempts (fraud, inventory abuse)
 */
export async function checkCheckoutRateLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const redis = getRedis();

    if (!redis) {
        return memoryRateLimit(`checkout:${identifier}`, 10, 60000);
    }

    if (!checkoutLimiter) {
        checkoutLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(60, '1 m'), // Audit Fix: Increased from 10 to 60
            analytics: true,
            prefix: 'ratelimit:checkout',
        });
    }

    const result = await checkoutLimiter.limit(identifier);
    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}

/**
 * Login rate limit: 5 attempts per minute
 * Prevents brute force password attacks
 */
export async function checkLoginRateLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const redis = getRedis();

    if (!redis) {
        return memoryRateLimit(`login:${identifier}`, 5, 60000);
    }

    if (!loginLimiter) {
        loginLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(20, '1 m'), // Audit Fix: Increased from 5 to 20
            analytics: true,
            prefix: 'ratelimit:login',
        });
    }

    const result = await loginLimiter.limit(identifier);
    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}

/**
 * Webhook rate limit: 100 requests per minute
 * Prevents DoS via webhook replay attacks
 */
export async function checkWebhookRateLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const redis = getRedis();

    if (!redis) {
        return memoryRateLimit(`webhook:${identifier}`, 100, 60000);
    }

    if (!webhookLimiter) {
        webhookLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(100, '1 m'),
            analytics: true,
            prefix: 'ratelimit:webhook',
        });
    }

    const result = await webhookLimiter.limit(identifier);
    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}

/**
 * General API rate limit: 60 requests per minute
 */
export async function checkApiRateLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}> {
    const redis = getRedis();

    if (!redis) {
        return memoryRateLimit(`api:${identifier}`, 60, 60000);
    }

    if (!apiLimiter) {
        apiLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(60, '1 m'),
            analytics: true,
            prefix: 'ratelimit:api',
        });
    }

    const result = await apiLimiter.limit(identifier);
    return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
    };
}

/**
 * Helper to get client identifier from headers
 */
export function getClientIdentifier(headers: Headers): string {
    const xff = headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();

    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp;

    return 'unknown-client';
}
