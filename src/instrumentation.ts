
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
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
