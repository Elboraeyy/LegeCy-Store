export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId: string | null;
}

export enum OrderStatus {
  Pending = 'pending',
  PaymentPending = 'payment_pending',   // Waiting for online payment
  PaymentFailed = 'payment_failed',     // Online payment failed
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  CashReceived = 'cash_received',       // COD order with cash collected (for revenue recognition)
  Cancelled = 'cancelled',
}

export type OrderEventTypes =
  | 'CREATED' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'; // Lifecycle events

export interface OrderHistoryItem {
  id: string;
  orderId: string;
  from: string;
  to: string;
  createdAt: string;
}

export interface Order {
  id: string; // UUID
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string; // ISO string

  history?: OrderHistoryItem[];
  user?: {
    name: string | null;
    email: string | null;
  };
}
