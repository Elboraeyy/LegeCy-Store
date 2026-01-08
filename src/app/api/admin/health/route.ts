import { NextResponse } from 'next/server';
import { validateProductionSecrets, ValidationResult } from '@/lib/env-validator';
import prisma from '@/lib/prisma';
import { isDistributedRateLimitingEnabled } from '@/lib/auth/rate-limit';
import { getKillSwitches } from '@/lib/killSwitches';
import { getMetricsSnapshot } from '@/lib/monitoring';

/**
 * Admin Health Dashboard Endpoint
 * 
 * Returns comprehensive system health status for operators.
 * Protected by admin session (middleware handles auth).
 */

export const dynamic = 'force-dynamic';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  components: {
    database: ComponentHealth;
    secrets: ComponentHealth;
    rateLimit: ComponentHealth;
    payments: ComponentHealth;
    email: ComponentHealth;
    cron: ComponentHealth;
  };
  killSwitches: Record<string, boolean>;
  metrics: Record<string, unknown>;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  message: string;
  lastChecked: string;
}

async function checkDatabaseHealth(): Promise<ComponentHealth> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      message: 'Database connection successful',
      lastChecked: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 'critical',
      message: `Database connection failed: ${String(e)}`,
      lastChecked: new Date().toISOString()
    };
  }
}

function checkSecretsHealth(): { health: ComponentHealth; details: ValidationResult } {
  const result = validateProductionSecrets();
  
  if (!result.valid) {
    return {
      health: {
        status: 'critical',
        message: `Missing ${result.missing.length} critical secrets`,
        lastChecked: new Date().toISOString()
      },
      details: result
    };
  }
  
  if (result.warnings.length > 0) {
    return {
      health: {
        status: 'degraded',
        message: `${result.warnings.length} optional secrets not configured`,
        lastChecked: new Date().toISOString()
      },
      details: result
    };
  }
  
  return {
    health: {
      status: 'healthy',
      message: 'All secrets properly configured',
      lastChecked: new Date().toISOString()
    },
    details: result
  };
}

function checkRateLimitHealth(): ComponentHealth {
  const isEnabled = isDistributedRateLimitingEnabled();
  
  if (!isEnabled) {
    return {
      status: process.env.NODE_ENV === 'production' ? 'critical' : 'degraded',
      message: 'Distributed rate limiting (Upstash) not configured',
      lastChecked: new Date().toISOString()
    };
  }
  
  return {
    status: 'healthy',
    message: 'Upstash rate limiting configured',
    lastChecked: new Date().toISOString()
  };
}

function checkPaymentsHealth(): ComponentHealth {
  const hasApiKey = !!process.env.PAYMOB_API_KEY;
  const hasHmacSecret = !!process.env.PAYMOB_HMAC_SECRET;
  const hasIntegrationId = !!process.env.PAYMOB_INTEGRATION_ID;
  
  if (!hasApiKey || !hasHmacSecret || !hasIntegrationId) {
    return {
      status: 'critical',
      message: 'Paymob configuration incomplete',
      lastChecked: new Date().toISOString()
    };
  }
  
  return {
    status: 'healthy',
    message: 'Paymob configuration complete',
    lastChecked: new Date().toISOString()
  };
}

function checkEmailHealth(): ComponentHealth {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;
  
  if (!hasApiKey) {
    return {
      status: 'critical',
      message: 'Resend API key not configured',
      lastChecked: new Date().toISOString()
    };
  }
  
  if (!hasFromEmail || process.env.RESEND_FROM_EMAIL?.includes('resend.dev')) {
    return {
      status: 'degraded',
      message: 'Email using test sender - configure production domain',
      lastChecked: new Date().toISOString()
    };
  }
  
  return {
    status: 'healthy',
    message: 'Email configuration complete',
    lastChecked: new Date().toISOString()
  };
}

function checkCronHealth(): ComponentHealth {
  const hasCronSecret = !!process.env.CRON_SECRET;
  
  if (!hasCronSecret) {
    return {
      status: 'degraded',
      message: 'Cron secret not configured - jobs may fail',
      lastChecked: new Date().toISOString()
    };
  }
  
  return {
    status: 'healthy',
    message: 'Cron authentication configured',
    lastChecked: new Date().toISOString()
  };
}

function determineOverallHealth(components: HealthStatus['components']): 'healthy' | 'degraded' | 'critical' {
  const statuses = Object.values(components).map(c => c.status);
  
  if (statuses.includes('critical')) return 'critical';
  if (statuses.includes('degraded')) return 'degraded';
  return 'healthy';
}

export async function GET() {
  try {
    // Run health checks
    const [dbHealth, killSwitches, metrics] = await Promise.all([
      checkDatabaseHealth(),
      getKillSwitches(),
      getMetricsSnapshot()
    ]);
    
    const secretsCheck = checkSecretsHealth();
    
    const components = {
      database: dbHealth,
      secrets: secretsCheck.health,
      rateLimit: checkRateLimitHealth(),
      payments: checkPaymentsHealth(),
      email: checkEmailHealth(),
      cron: checkCronHealth()
    };
    
    const healthStatus: HealthStatus = {
      overall: determineOverallHealth(components),
      timestamp: new Date().toISOString(),
      components,
      killSwitches,
      metrics
    };
    
    const httpStatus = healthStatus.overall === 'critical' ? 503 : 200;
    
    return NextResponse.json(healthStatus, { status: httpStatus });
    
  } catch (error) {
    return NextResponse.json({
      overall: 'critical',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: String(error)
    }, { status: 500 });
  }
}
