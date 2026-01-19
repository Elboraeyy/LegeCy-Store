import { eventBus, EVENTS } from './eventBus';
import { stockNotificationService } from './services/stockNotificationService';
import { logger } from './logger';

/**
 * Initialize Event Subscribers
 * This should be imported/called once at startup (or in a shared space like instrumentation)
 */
export function registerSubscribers() {
    logger.info('[EventBus] Registering subscribers...');

    // Inventory -> Stock Notification
    eventBus.on(EVENTS.INVENTORY.STOCK_INCREASED, async (data: { variantId: string }) => {
        logger.info(`[EventBus] Handling STOCK_INCREASED for ${data.variantId}`);
        await stockNotificationService.notifySubscribers(data.variantId);
    });
}
