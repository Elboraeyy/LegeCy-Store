import { OrderStatus } from '@/lib/orderStatus';
import { InventoryError } from '@/lib/errors';

export const INVENTORY_POLICIES = {
  // Invariant: Stock cannot go below zero (Application Level Check)
  ensurePositiveStock: (current: number, change: number) => {
    if (current + change < 0) {
      throw new InventoryError('Invariant Violation: Resulting stock would be negative.');
    }
  },

  // Invariant: Cannot commit stock for an order that isn't paid
  requirePaymentForCommit: (orderStatus: OrderStatus) => {
    if (orderStatus !== OrderStatus.Paid && orderStatus !== OrderStatus.Shipped) {
       // Allow commit if we are moving TO Paid/Shipped, generally we commit ON Paid.
       // But strictly speaking, we shouldn't commit unless the money is secured.
       if (orderStatus === OrderStatus.Pending || orderStatus === OrderStatus.Cancelled) {
           throw new InventoryError(`Invariant Violation: Cannot commit stock for order in ${orderStatus} state. Payment required.`);
       }
    }
  }
};
