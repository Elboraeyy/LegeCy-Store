export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId: string | null;
}

export enum OrderStatus {
  Draft = 'draft',
  Pending = 'pending',
  PaymentPending = 'payment_pending',
  Confirmed = 'confirmed',
  Preparing = 'preparing',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  CashReceived = 'cash_received',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
  PaymentFailed = 'payment_failed',
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
  orderNumber: number;
  totalPrice: number;
  status: OrderStatus;
  createdAt: string; // ISO string
  paymentMethod: string;
  orderSource?: string;
  riskScore?: number;
  hasDispute?: boolean;
  items: OrderItem[];

  firstName?: string | null;
  lastName?: string | null;
  alternativePhone?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  shippingAddress?: string | null;
  shippingGovernorate?: string | null;
  shippingCity?: string | null;
  shippingNotes?: string | null;
  history?: OrderHistoryItem[];
  user?: {
    name: string | null;
    email: string | null;
  };
}
