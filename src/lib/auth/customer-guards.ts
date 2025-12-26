import prismaClient from '@/lib/prisma';
const prisma = prismaClient!;
import { validateCustomerSession } from './session';
import { AuthError, PermissionError } from '@/lib/errors';

/**
 * Ensures the currently logged-in customer is the owner of the order.
 * @param orderId 
 */
export async function requireOrderOwner(orderId: string) {
    const { session, user } = await validateCustomerSession();
    
    if (!session || !user) {
        throw new AuthError('You must be logged in to access this order.');
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) {
        // Return 404 or generic Forbidden to avoid leaking existence?
        // For business apps, usually better to say "Not Found" if not exists 
        // OR "Forbidden" if exists but not yours.
        throw new Error('Order not found');
    }

    // If order has no user (guest), we currently deny access via this guard 
    // (Guest access requires future "Guest Token" implementation).
    if (!order.userId) {
        throw new PermissionError('This order was placed by a guest. Access via tracking link only.');
    }

    if (order.userId !== user.id) {
         // Log potential IDOR attempt here?
        console.warn(`[SECURITY] IDOR Attempt? User ${user.id} tried to access Order ${orderId} owned by ${order.userId}`);
        throw new PermissionError('You do not have permission to view this order.');
    }

    return { user, order };
}
