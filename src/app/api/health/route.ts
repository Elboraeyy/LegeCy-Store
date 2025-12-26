import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { config } from '@/lib/config';

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Used by:
 * - Load balancers
 * - Kubernetes probes
 * - Monitoring systems
 * 
 * Returns 200 if healthy, 503 if unhealthy
 */

interface HealthCheck {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    environment: string;
    checks: {
        database: {
            status: 'up' | 'down';
            latencyMs?: number;
        };
        config: {
            status: 'valid' | 'invalid';
            issues?: string[];
        };
    };
}

export async function GET() {
    const checks: HealthCheck['checks'] = {
        database: { status: 'down' },
        config: { status: 'valid' },
    };
    
    // Check database connectivity
    try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        checks.database = {
            status: 'up',
            latencyMs: Date.now() - dbStart,
        };
    } catch {
        checks.database = { status: 'down' };
    }
    
    // Validate production config
    if (config.isProd) {
        const configCheck = await import('@/lib/config').then(m => m.validateProductionConfig());
        if (!configCheck.valid) {
            checks.config = {
                status: 'invalid',
                issues: configCheck.issues,
            };
        }
    }
    
    // Determine overall status
    const isHealthy = checks.database.status === 'up' && checks.config.status === 'valid';
    const isDegraded = checks.database.status === 'up' && checks.config.status === 'invalid';
    
    const healthResponse: HealthCheck = {
        status: isHealthy ? 'healthy' : (isDegraded ? 'degraded' : 'unhealthy'),
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        checks,
    };
    
    const statusCode = isHealthy ? 200 : (isDegraded ? 200 : 503);
    
    return NextResponse.json(healthResponse, { 
        status: statusCode,
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
    });
}
