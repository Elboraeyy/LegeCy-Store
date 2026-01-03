import { hash, verify } from 'argon2';
import { logger } from '@/lib/logger';

/**
 * Validates a password against its hash.
 */
export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
    try {
        return await verify(hashValue, password);
    } catch (e) {
        logger.error('Password verification failed', { error: e });
        return false;
    }
}

/**
 * Hashes a password using Argon2id with OWASP recommended params.
 */
export async function hashPassword(password: string): Promise<string> {
    return await hash(password, {
        timeCost: 2, // Equivalent to "salt rounds" in bcrypt (CPU cost)
        memoryCost: 19456, // 19 MB RAM usage
        parallelism: 1
    });
}

export type PasswordPolicyResult = {
    isValid: boolean;
    issues: string[];
};

/**
 * Enforces Strict Password Policy
 * - Min 7 chars
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 number
 * - At least 1 special char
 */
export function validatePasswordStrength(password: string): PasswordPolicyResult {
    const issues: string[] = [];

    if (password.length < 7) issues.push('Password must be at least 7 characters long');
    if (!/[A-Z]/.test(password)) issues.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) issues.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(password)) issues.push('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) issues.push('Password must contain at least one special character');

    return {
        isValid: issues.length === 0,
        issues
    };
}
