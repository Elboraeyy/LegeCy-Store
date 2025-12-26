import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createOrderSchema } from '@/lib/validators/order';
import { validateOrderTransition } from '@/lib/policies/orderPolicy';
import { OrderStatus } from '@/lib/orderStatus';

describe('Order Logic', () => {
  describe('Validators', () => {
    it('should validate a correct order payload', () => {
      const payload = {
        items: [{ productId: 'abc', name: 'Test Product', price: 100, quantity: 1 }],
        totalPrice: 100
      };
      const result = createOrderSchema.safeParse(payload);
      assert.ok(result.success);
    });

    it('should reject negative quantity', () => {
      const payload = {
        items: [{ productId: 'abc', name: 'Test', price: 100, quantity: -1 }],
        totalPrice: 100
      };
      const result = createOrderSchema.safeParse(payload);
      assert.strictEqual(result.success, false);
    });

    it('should reject missing items', () => {
      const payload = { items: [], totalPrice: 0 };
      const result = createOrderSchema.safeParse(payload);
      assert.strictEqual(result.success, false);
    });
  });

  describe('Policies', () => {
    it('should allow Admin to cancel Pending order', () => {
      assert.doesNotThrow(() => 
        validateOrderTransition(OrderStatus.Pending, OrderStatus.Cancelled, 'admin')
      );
    });

    it('should deny Customer from marking order as Paid', () => {
      assert.throws(() => 
         validateOrderTransition(OrderStatus.Pending, OrderStatus.Paid, 'customer')
      , /Access Denied/);
    });

    it('should deny invalid transitions (Pending -> Delivered)', () => {
      assert.throws(() => 
         validateOrderTransition(OrderStatus.Pending, OrderStatus.Delivered, 'admin')
      , /Invalid transition/);
    });
  });
});
