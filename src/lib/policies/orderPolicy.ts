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
    [OrderStatus.PaymentPending]: {
      allowedTo: [OrderStatus.Pending, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Pending]: ['admin', 'system'], // Admin verifies payment
        [OrderStatus.Cancelled]: ['admin', 'system'],
      },
    },
    [OrderStatus.Pending]: {
      allowedTo: [OrderStatus.Confirmed, OrderStatus.Paid, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Paid]: ['admin', 'system'], // Admin can manually mark as Paid (Online verification)
        [OrderStatus.Confirmed]: ['admin'], // Admin confirms COD orders
        [OrderStatus.Cancelled]: ['admin', 'customer', 'system'],
      },
    },
    [OrderStatus.Paid]: {
      allowedTo: [OrderStatus.Confirmed, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Confirmed]: ['admin'], // Admin confirms after payment verification
        [OrderStatus.Cancelled]: ['admin', 'system'],
      },
    },
    [OrderStatus.Confirmed]: {
      allowedTo: [OrderStatus.Preparing, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Preparing]: ['admin'],
        [OrderStatus.Cancelled]: ['admin'],
      },
    },
    [OrderStatus.Preparing]: {
      allowedTo: [OrderStatus.Shipped, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Shipped]: ['admin'],
        [OrderStatus.Cancelled]: ['admin'],
      },
    },
    [OrderStatus.Shipped]: {
      allowedTo: [OrderStatus.Delivered, OrderStatus.Cancelled],
      roles: {
        [OrderStatus.Delivered]: ['admin', 'system'],
        [OrderStatus.Cancelled]: ['admin'],
      },
    },
    [OrderStatus.Delivered]: {
      allowedTo: [OrderStatus.Refunded],
      roles: {
        [OrderStatus.Refunded]: ['admin'],
      },
    },
    [OrderStatus.Refunded]: {
      allowedTo: [],
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
