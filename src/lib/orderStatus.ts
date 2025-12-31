import { OrderStatus } from '@/types/order';

export { OrderStatus };

/**
 * Basic transition check - used for UI display.
 * For actual authorization, use validateOrderTransition from orderPolicy.ts
 * 
 * NOTE: This is kept in sync with ORDER_POLICIES.transitions in orderPolicy.ts
 * The orderPolicy.ts is the source of truth for role-based authorization.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.Pending]: [OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.Shipped, OrderStatus.Cancelled],
  [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [],
  [OrderStatus.Cancelled]: [], 
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

