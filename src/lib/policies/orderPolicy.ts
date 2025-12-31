import { OrderStatus } from '@/lib/orderStatus';
import { OrderError, ForbiddenError } from '@/lib/errors';

export type ActorRole = 'admin' | 'system' | 'customer';

type TransitionPolicy = {
    allowedTo: OrderStatus[];
    roles: Partial<Record<OrderStatus, ActorRole[]>>; // Key is target status
};

export const ORDER_POLICIES: { transitions: Partial<Record<OrderStatus, TransitionPolicy>> } = {
  // Who can perform which transitions?
  transitions: {
    [OrderStatus.Pending]: {
      allowedTo: [OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Paid]: ['system'], // Only system (webhook) can mark paid
        [OrderStatus.Shipped]: ['admin'], // Admin can ship COD orders directly
        [OrderStatus.Cancelled]: ['admin', 'customer', 'system'],
      },
    },
    [OrderStatus.Paid]: {
      allowedTo: [OrderStatus.Shipped, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Shipped]: ['admin', 'system'],
        [OrderStatus.Cancelled]: ['admin', 'system'], // Customer cannot cancel after payment without support
      },
    },
    [OrderStatus.Shipped]: {
      allowedTo: [OrderStatus.Delivered, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Delivered]: ['admin', 'system'], // Courier webhook or admin
        [OrderStatus.Cancelled]: ['admin'], // Rare, but possible (lost package)
      },
    },
    [OrderStatus.Delivered]: {
      allowedTo: [], // Terminal state for now
      roles: {},
    },
    [OrderStatus.Cancelled]: {
      allowedTo: [], // Terminal state
      roles: {},
    },
  },
};

/**
 * Validates if an order transition is allowed for a specific actor role.
 * @throws OrderError if invalid status or transition.
 * @throws ForbiddenError if actor not allowed.
 */
export function validateOrderTransition(currentStatus: OrderStatus, newStatus: OrderStatus, actor: ActorRole) {
  // 1. Check if transition is generally possible
  const policy = ORDER_POLICIES.transitions[currentStatus];
  
  if (!policy) {
    throw new OrderError(`Unknown status: ${currentStatus}`);
  }

  if (!policy.allowedTo.includes(newStatus)) {
    throw new OrderError(`Invalid transition: Cannot move from ${currentStatus} to ${newStatus}`);
  }

  // 2. Check if actor has permission
  const allowedRoles = policy.roles[newStatus];
  if (!allowedRoles || !allowedRoles.includes(actor)) {
    throw new ForbiddenError(`Access Denied: Role '${actor}' cannot perform transition ${currentStatus} -> ${newStatus}`);
  }

  return true;
}
