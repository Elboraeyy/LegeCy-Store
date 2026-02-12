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
  [OrderStatus.PaymentPending]: [OrderStatus.Pending, OrderStatus.Cancelled],
  [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Paid, OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.Confirmed, OrderStatus.Cancelled],
  [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
  [OrderStatus.Preparing]: [OrderStatus.Shipped, OrderStatus.Cancelled],
  [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Cancelled],
  [OrderStatus.Delivered]: [OrderStatus.CashReceived],
  [OrderStatus.CashReceived]: [],
  [OrderStatus.Cancelled]: [], 
  [OrderStatus.Refunded]: [],
  [OrderStatus.PaymentFailed]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

