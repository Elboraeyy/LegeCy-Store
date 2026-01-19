import { logger } from '@/lib/logger';

type EventHandler<T = any> = (data: T) => Promise<void> | void;

class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    /**
     * Subscribe to an event
     */
    on<T>(event: string, handler: EventHandler<T>) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(handler);
    }

    /**
     * Publish an event (Fire and Forget)
     */
    emit<T>(event: string, data: T) {
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            eventHandlers.forEach(handler => {
                try {
                    // Execute, but don't let it crash the caller
                    // We don't await here to keep it "Fire & Forget" unless specified, 
                    // but for Next.js actions, we might want to await if we need it to finish before response?
                    // No, usually side effects like emails are fine to be detached (Next.js lifecycle might kill them though).
                    // Safe approach: Wrap in Promise.resolve
                    Promise.resolve(handler(data)).catch(err =>
                        logger.error(`[EventBus] Error in handler for ${event}`, err)
                    );
                } catch (e) {
                    logger.error(`[EventBus] Sync error in handler for ${event}`, e as any);
                }
            });
        }
    }

    /**
     * Publish and Await (for critical side effects)
     */
    async emitAndWait<T>(event: string, data: T) {
        const eventHandlers = this.handlers.get(event);
        if (eventHandlers) {
            await Promise.all(eventHandlers.map(h => h(data)));
        }
    }
}

export const eventBus = new EventBus();

// Events Constants
export const EVENTS = {
    INVENTORY: {
        STOCK_INCREASED: 'inventory.stock_increased',
        STOCK_LOW: 'inventory.stock_low'
    },
    ORDER: {
        CREATED: 'order.created',
        STATUS_CHANGED: 'order.status_changed'
    }
};
