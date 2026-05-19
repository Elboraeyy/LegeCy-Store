export const NON_REVENUE_ORDER_STATUSES = [
  "cancelled",
  "CANCELLED",
  "canceled",
  "CANCELED",
  "payment_failed",
  "PAYMENT_FAILED",
  "failed",
  "FAILED",
  "rejected",
  "REJECTED",
  "refunded",
  "REFUNDED",
  "partially_refunded",
  "PARTIALLY_REFUNDED",
  "returned",
  "RETURNED",
] as const;

export const CANCELLATION_ORDER_STATUSES = [
  "cancelled",
  "CANCELLED",
  "canceled",
  "CANCELED",
] as const;

export const revenueOrderStatusFilter = {
  notIn: [...NON_REVENUE_ORDER_STATUSES],
};

export const cancellationOrderStatusFilter = {
  in: [...CANCELLATION_ORDER_STATUSES],
};

export function netOrderRevenue(order: {
  totalPrice: unknown;
  shippingCost?: unknown;
}) {
  return Number(order.totalPrice || 0) - Number(order.shippingCost || 0);
}

export function isRevenueOrderStatus(status: string | null | undefined) {
  return !NON_REVENUE_ORDER_STATUSES.includes(
    (status || "") as (typeof NON_REVENUE_ORDER_STATUSES)[number],
  );
}
