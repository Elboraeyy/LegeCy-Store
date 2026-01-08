/**
 * Next.js Instrumentation Hook
 * 
 * This runs at server startup BEFORE any request is processed.
 * CRITICAL: We use this to validate secrets and fail-closed if missing.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // PHASE 1: Validate production secrets (FAIL-CLOSED)
        console.log('[System Boot] Validating production secrets...');
        const { enforceSecretValidation } = await import('./lib/env-validator');
        enforceSecretValidation();
        
        // PHASE 2: Run maintenance jobs
        const { processExpiredPayments, processZombieOrders } = await import('./lib/services/paymentService');
        
        console.log('[System Boot] Running initial maintenance jobs...');
        
        // Run in background to not block boot
        Promise.all([
            processExpiredPayments(),
            processZombieOrders()
        ]).then(([expired, zombies]) => {
            if (expired > 0 || zombies > 0) {
                 console.log(`[System Boot] Maintenance complete. Cleaned ${expired} payments and ${zombies} zombie orders.`);
            }
        }).catch(err => {
            console.error('[System Boot] Maintenance failed:', err);
        });
    }
}
