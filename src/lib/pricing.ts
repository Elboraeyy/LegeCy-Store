import { OrderItem } from '@/types/order';

export const calculateOrderTotal = (items: OrderItem[]): number => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return 0;
  }

  // Calculate sum of price * quantity for all items
  // We assume price is in the smallest currency unit (like cents) or handle floats strictly if needed.
  // Based on the prompt example "price": 12000, it seems to be a flat number, likely whole units or pre-scaled.
  // We will do a simple accumulation.
  
  return items.reduce((total, item) => {
    // Defensive check for invalid item data
    const price = typeof item.price === 'number' ? item.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
    
    // Ensure no negative values affect the total
    const safePrice = Math.max(0, price);
    const safeQuantity = Math.max(0, quantity);

    return total + (safePrice * safeQuantity);
  }, 0);
};
