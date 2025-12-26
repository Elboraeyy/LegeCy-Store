export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variantId: string | null;
}

export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

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
